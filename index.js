const { EOL } = require('os')
const chessRules = require('chess-rules')
const keypress = require('keypress')

const pieces = []
pieces.P = '♟ '
pieces.N = '♞ '
pieces.R = '♜ '
pieces.B = '♝ '
pieces.Q = '♛ '
pieces.K = '♚ '

// ascii code colors

const cursorColor = '42'
const black = '40'
const white = '47'
const blue = '36'
const pink = '35'

module.exports = class Chess {
  constructor () {
    this.cursorPos = [0, 0]
    this.moveSrc = null
    this.moveDst = null
    this.position = chessRules.getInitialPosition()
    this.log = ''
  }

  start () {
    process.stdin.on('keypress', (_, key) => {
      if (key.name === 'up') {
        this.cursorPos[0] = ++this.cursorPos[0] % 8
      }
      if (key.name === 'right') {
        this.cursorPos[1] = ++this.cursorPos[1] % 8
      }
      if (key.name === 'down') {
        this.cursorPos[0] = --this.cursorPos[0] % 8 & 7
      }
      if (key.name === 'left') {
        this.cursorPos[1] = --this.cursorPos[1] % 8 & 7
      }
      if (key.name === 'return') {
        this._onPressedReturn()
      }
      this.render()
    })

    keypress(process.stdin)
    process.stdin.setRawMode(true)
    process.stdin.resume()

    this.render() // initial render
  }

  render () {
    console.clear()
    console.log(this._positionToAscii(this.position))
    console.log('log:', this.log)
  }

  moveIsLegal (move) {
    const moves = chessRules.getAvailableMoves(this.position)
    return !!moves.find(e => e.src === move.src && e.dst === move.dst)
  }

  getPosition (fen = false) {
    return fen ? chessRules.positionToFen(this.position) : this.position
  }

  move (src, dst) {
    this.position = chessRules.applyMove(this.position, {src, dst})
  }

  _positionToAscii (position) {
    let lines = ''
    for (let i = 7; i >= 0; i--) {
      let line = ''
      for (let j = 7; j >= 0; j--) {
        const square = this.position.board[(i * 8) + j]
        const background = (i === this.cursorPos[0] && j === this.cursorPos[1]) ? cursorColor : (i % 2 === 0 && j % 2 === 0) || (i % 2 !== 0 && j % 2 !== 0) ? black : white
        const foreground = !square ? background : square.side === 'W' ? blue : pink
        const ascii = !square ? '  ' : pieces[square.type]
        line = `\x1B[${background};${foreground}m${ascii}\x1B[39;49m` + line
      }
      lines += line + EOL
    }
    return lines
  }

  _onPressedReturn () {
    if (this.moveSrc === null) {
      this.moveSrc = this._getCursorPos()
    } else {
      this.moveDst = this._getCursorPos()
      const move = { src: this.moveSrc, dst: this.moveDst }
      if (this.moveIsLegal(move)) {
        this.log = chessRules.moveToPgn(this.position, move)
        this.position = chessRules.applyMove(this.position, move)
      } else {
        this.log = 'ilegal move'
      }
      this.moveSrc = null
      this.moveDst = null
    }
  }

  _getCursorPos () {
    return this.cursorPos[0] * 8 + this.cursorPos[1]
  }
}
