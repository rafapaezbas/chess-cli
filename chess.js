const { EventEmitter } = require('events')
const ram = require('random-access-memory')
const Corestore = require('corestore')
const Hyperswarm = require('hyperswarm')
const crypto = require('hypercore-crypto')
const chessRules = require('chess-rules')

class Channel extends EventEmitter {
  constructor (local, remote) {
    super()
    this.local = local
    this.remote = remote
    this.init = Buffer.compare(local.key, remote.key) > 0
    this.state = this.init ? 'IDLE' : 'WAITING'

    this.remote.on('append', async () => {
      const data = await this.remote.get(this.remote.length - 1)
      if (crypto.verify(Buffer.from(data.data), Buffer.from(data.signature, 'hex'), this.local.key)) return
      if (!crypto.verify(Buffer.from(data.data), Buffer.from(data.signature, 'hex'), this.remote.key)) throw new Error('Not verified')
      await this.local.append(data)
      this.state = 'IDLE'
      this.emit('remote', data)
    })
  }

  async push (data) {
    if (this.state !== 'IDLE') throw new Error('Waiting for ack')
    const signature = this.local.auth.sign(Buffer.from(JSON.stringify(data)))
    await this.local.append({ signature: signature.toString('hex'), data: JSON.stringify(data) })
    this.state = 'WAITING'
  }
}

class HyperChess extends EventEmitter {
  constructor (chess, local, remote) {
    super()
    this.local = local
    this.remote = remote
    this.swarm = new Hyperswarm()
    this.store = new Corestore(ram)
    this.chess = chess
    this.channel = null

    this.swarm.on('connection', (connection) => {
      console.log('connection')
      this.store.replicate(connection)
    })
  }

  async ready () {
    await this.store.ready()

    const remote = this.store.get({ keyPair: this.remote, valueEncoding: 'json' })
    const local = this.store.get({ keyPair: this.local, valueEncoding: 'json' })

    await remote.ready()
    await local.ready()

    this.swarm.join(remote.discoveryKey)
    this.swarm.join(local.discoveryKey)

    this.channel = new Channel(local, remote, this.remoteMove.bind(this))
    this.channel.on('remote', (move) => {
      this.moveRemote(JSON.parse(move))
    })
  }

  async move (move) {
    await this.channel.push(move)
    this.chess.move(move)
    this.emit('move')
  }

  remoteMove (move) {
    this.chess.move(move)
    this.emit('move')
  }
}

class Chess {
  constructor () {
    this.position = chessRules.getInitialPosition()
  }

  moveIsLegal (move) {
    const moves = chessRules.getAvailableMoves(this.position)
    return !!moves.find(e => e.src === move.src && e.dst === move.dst)
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
  Channel,
  HyperChess,
  Chess
}
