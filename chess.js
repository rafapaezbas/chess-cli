const crypto = require('hypercore-crypto')
const chessRules = require('chess-rules')

class Channel {
  constructor (local, remote) {
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
    })
  }

  async push (data) {
    if (this.state !== 'IDLE') throw new Error('Waiting for ack')
    const signature = crypto.sign(Buffer.from(JSON.stringify(data)), this.local.keyPair.secretKey)
    await this.local.append({ signature: signature.toString('hex'), data: JSON.stringify(data) })
    this.state = 'WAITING'
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
  Chess
}
