const crypto = require('hypercore-crypto')
const RAM = require('random-access-memory')
const Hypercore = require('hypercore')
const chessRules = require('chess-rules')
const b4a = require('b4a')

class MultiSigAuth {
  constructor (local, remote, opts = {}) {
    this.local = local
    this.remote = remote

    this._sign = opts.sign
      ? opts.sign
      : s => crypto.sign(s, opts.keyPair.secretKey)

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
    this.auth = new MultiSigAuth(local.publicKey, remote, { keyPair: local })
    this.core = new Hypercore(RAM, null, {
      valueEncoding: 'json',
      auth: this.auth
    })
  }

  ready () {
    return this.core.ready()
  }

  signable (data) {
    const batch = this.core.core.tree.batch()
    batch.append(this.core._encode(this.core.valueEncoding, data))
    const signable = batch.signable()
    return signable
  }

  commit (data) {
    return crypto.sign(this.signable(data), this.local.secretKey)
  }

  verify (data, signature) {
    const signable = this.signable(data)
    if (!crypto.verify(signable, signature, this.remote)) throw new Error('Bad commit')
    this.auth.addSignature(signature)
    return crypto.sign(signable, this.local.secretKey)
  }
}

class HyperChess {
  constructor (local, remote) {
    this.chess = new Chess()
    this.state = new State(local, remote)
  }

  ready () {
    return this.state.ready()
  }

  move (move) {
    if (!this.chess.moveIsLegal(move)) throw new Error('Ilegal local move')
    const newPosition = this.chess.move(move)
    const signature = this.state.commit(newPosition)
    return { move, signature }
  }

  remoteMove ({ move, signature }) {
    if (!this.chess.moveIsLegal(move)) throw new Error('Ilegal remote move')
    const newPosition = this.chess.move(move)
    return this.state.verify(newPosition, signature)
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
    return chessRules.getGameStatus() // OPEN, PAT, WHITEWON, BLACKWON
  }
}

module.exports = {
  HyperChess,
  Chess
}
