const { EventEmitter } = require('events')
const crypto = require('hypercore-crypto')
const RAM = require('random-access-memory')
const Hypercore = require('hypercore')
const Hyperswarm = require('hyperswarm')
const Corestore = require('corestore')
const Autochannel = require('autochannel')
const chessRules = require('chess-rules')
const b4a = require('b4a')

class MultiSigAuth {
  constructor (local, remote, opts = {}) {
    this.keyPair = local?.publicKey ? local : opts.keyPair

    this.local = local?.publicKey || local
    this.remote = remote

    this._sign = opts.sign
      ? opts.sign
      : s => crypto.sign(s, this.keyPair.secretKey)

    this.sigs = []

    this.localFirst = b4a.compare(this.local, this.remote) < 0
  }

  sign (signable) {
    const remote = this.sigs.find((signature) => {
      return crypto.verify(signable, signature, this.remote)
    })

    if (!remote) throw new Error('No remote signature.')

    const local = this._sign(signable)

    const sigs = []
    sigs.push(this.localFirst ? local : remote)
    sigs.push(this.localFirst ? remote : local)

    return b4a.concat(sigs)
  }

  verify (signable, signature) {
    const sig1 = signature.subarray(0, 64)
    const sig2 = signature.subarray(64)

    const key1 = this.localFirst ? this.local : this.remote
    const key2 = this.localFirst ? this.remote : this.local

    return crypto.verify(signable, sig1, key1) &&
        crypto.verify(signable, sig2, key2)
  }

  addSignature (m) {
    this.sigs.push(m)
  }
}

class State {
  constructor (local, remote, opts = {}) {
    this.local = local
    this.remote = remote
    this.auth = new MultiSigAuth(local, remote)
    this.core = new Hypercore(RAM, null, {
      valueEncoding: 'json',
      auth: this.auth
    })
  }

  ready () {
    return this.core.ready()
  }

  signable (data) {
    if (!Array.isArray(data)) return this.signable([data])

    const batch = this.core.core.tree.batch()
    for (const pos of data) {
      batch.append(this.core._encode(this.core.valueEncoding, pos))
    }

    return batch.signable()
  }

  commit (data) {
    return crypto.sign(this.signable(data), this.local.secretKey)
  }

  async verify (data, signature) {
    const signable = this.signable(data)

    if (!crypto.verify(signable, signature, this.remote)) {
      throw new Error('Bad commit')
    }

    this.auth.addSignature(signature)
    await this.core.append(data)

    return crypto.sign(signable, this.local.secretKey)
  }
}

class HyperChess extends EventEmitter {
  constructor (opts = {}) {
    super()

    this.local = crypto.keyPair()

    this.chess = new Chess()
    this.store = new Corestore(RAM)
    this.pending = []

    this.channelKey = crypto.keyPair()
    this.channel = null

    this.swarm = new Hyperswarm(opts)
    this.swarm.on('connection', conn => {
      console.log('Peer ' + this.channel.remote.key.slice(0, 4).toString('hex') + ' joined, let the game begin!')
      this.store.replicate(conn, { live: true })
    })

    this.firstToPlay = false
    this.batch = null
  }

  ready () {
    return this.state.ready()
  }

  getPosition (fen) {
    return this.batch !== null ? this.batch.getPosition(fen) : this.chess.getPosition(fen)
  }

  async joinGame (remoteKey, remoteChannelKey) {
    this.state = new State(this.local, remoteKey)

    const local = this.store.get({ keyPair: this.channelKey, valueEncoding: 'json' })
    const remote = this.store.get({ key: remoteChannelKey, valueEncoding: 'json' })

    await local.ready()
    await remote.ready()

    this.channel = new Autochannel(local, remote, { onBatch: this.processBatch.bind(this) })
    this.channel.on('data', () => {})

    this.swarm.join(local.discoveryKey)
    this.swarm.join(remote.discoveryKey)
    await this.swarm.flush()

    this.firstToPlay = this.channel.isInitiator
  }

  move (move) {
    if (!this.chess.moveIsLegal(move)) throw new Error('Ilegal local move')
    this.batch = this.chess.batch()
    this.batch.move(move)
    this.channel.append(move)
    return move
  }

  async processBatch (blocks = []) {
    const batch = this.chess.batch()

    for (let i = 0; i < blocks.length; i++) {
      const { commitment, op } = blocks[i]

      if (op) {
        if (!batch.moveIsLegal(op)) throw new Error('Ilegal move')
        const position = batch.move(op)
        const commitment = this.state.commit(position)
        this.chess.position = batch.getPosition()

        await this.channel.append(null, commitment)
      }

      if (commitment && !this.channel.local.key.equals(blocks[i].core.key)) {
        const position = batch.getPosition(true)
        await this.state.verify(position, Buffer.from(commitment))
      }
    }
  }
}

class Chess {
  constructor (position = chessRules.getInitialPosition(), parent = null) {
    this.position = position
    this.parent = parent
  }

  moveIsLegal (move) {
    const moves = chessRules.getAvailableMoves(this.position)
    return !!moves.find(e => e.src === move.src && e.dst === move.dst)
  }

  batch () {
    return new Chess(this.position, this)
  }

  getPosition (fen = false) {
    return fen ? chessRules.positionToFen(this.position) : this.position
  }

  move ({ src, dst }) {
    this.position = chessRules.applyMove(this.position, { src, dst })
    return this.getPosition(true)
  }

  inCheck () {
    return this.position.check
  }

  status () {
    return chessRules.getGameStatus(this.position) // OPEN, PAT, WHITEWON, BLACKWON
  }

  availableMoves () {
    return chessRules.getAvailableMoves(this.position)
  }
}

module.exports = {
  HyperChess,
  Chess
}
