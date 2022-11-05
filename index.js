const { EOL } = require('os')
const chessRules = require('chess-rules')

const position = chessRules.getInitialPosition()

const pieces = []
pieces.P = '♟ '
pieces.N = '♞ '
pieces.R = '♜ '
pieces.B = '♝ '
pieces.Q = '♛ '
pieces.K = '♚ '

// ascii code colors
const black = '40'
const white = '47'
const blue = '35'
const pink = '36'

const positionToAscii = (position) => {
  let render = ''
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = position.board[(i * 8) + j]
      const background = (i % 2 === 0 && j % 2 === 0) || (i % 2 !== 0 && j % 2 !== 0) ? white : black
      const foreground = !square ? background : square.side === 'W' ? blue : pink
      const ascii = !square ? '  ' : pieces[square.type]
      render += `\x1B[${background};${foreground}m${ascii}\x1B[39;49m`
    }
    render += EOL
  }

  return render
}

console.log(positionToAscii(position))
