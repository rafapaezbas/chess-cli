const { EOL } = require('os')
const chessRules = require('chess-rules')
const keypress = require('keypress')

const cursorPos = [0, 0]
let frame = 0

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

const positionToAscii = (position) => {
  position.board.reverse() // renders black on top
  let render = ''
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const square = position.board[(i * 8) + j]
      const background = (i === cursorPos[1] && j === cursorPos[0]) ? cursorColor : (i % 2 === 0 && j % 2 === 0) || (i % 2 !== 0 && j % 2 !== 0) ? white : black
      const foreground = !square ? background : square.side === 'W' ? blue : pink
      const ascii = !square ? '  ' : pieces[square.type]
      render += `\x1B[${background};${foreground}m${ascii}\x1B[39;49m`
    }
    render += EOL
  }
  return render
}

// cursor control

keypress(process.stdin)
process.stdin.setRawMode(true)
process.stdin.resume()

process.stdin.on('keypress', function (ch, key) {
  if (key.name === 'right') {
    cursorPos[0] = (cursorPos[0] + 1) % 8
  }
  if (key.name === 'down') {
    cursorPos[1] = (cursorPos[1] + 1) % 8
  }
  if (key.name === 'left') {
    cursorPos[0]--
    if (cursorPos[0] === -1) cursorPos[0] = 7
  }
  if (key.name === 'up') {
    cursorPos[1]--
    if (cursorPos[1] === -1) cursorPos[1] = 7
  }
})

// game loop

setInterval(() => {
  console.clear()
  console.log(positionToAscii(chessRules.getInitialPosition()))
  console.log('frame: ', frame++)
  console.log('cursorX:', cursorPos[0])
  console.log('cursorY:', cursorPos[1])
}, 50)
