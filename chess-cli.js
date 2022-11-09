const { EOL } = require('os')
const chessRules = require('chess-rules')

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

module.exports = class ChessCli {
  positionToAscii (fen, cursor = []) {
    const position = chessRules.fenToPosition(fen)
    let lines = ''
    for (let i = 7; i >= 0; i--) {
      let line = ''
      for (let j = 7; j >= 0; j--) {
        const square = position.board[(i * 8) + j]
        const background = isCursorPos(i, j, cursor) ? cursorColor : isBlackSquare(i, j) ? black : white
        const foreground = !square ? background : square.side === 'W' ? blue : pink
        const ascii = !square ? '  ' : pieces[square.type]
        line = toAscii(background, foreground, ascii) + line
      }
      lines += line + EOL
    }
    return lines
  }
}

function isCursorPos (i, j, cursor) {
  return (i === cursor[0] && j === cursor[1])
}

function isBlackSquare (i, j) {
  return i % 2 === j % 2
}

function toAscii (background, foreground, ascii) {
  return `\x1B[${background};${foreground}m${ascii}\x1B[39;49m`
}
