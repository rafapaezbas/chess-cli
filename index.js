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

// state

const cursorPos = [0, 0]
let moveSrc = null
let moveDst = null
let position = chessRules.getInitialPosition()
let log = ''

const positionToAscii = (position) => {
  let lines = ''
  for (let i = 7; i >= 0; i--) {
    let line = ''
    for (let j = 7; j >= 0; j--) {
      const square = position.board[(i * 8) + j]
      const background = (i === cursorPos[0] && j === cursorPos[1]) ? cursorColor : (i % 2 === 0 && j % 2 === 0) || (i % 2 !== 0 && j % 2 !== 0) ? black : white
      const foreground = !square ? background : square.side === 'W' ? blue : pink
      const ascii = !square ? '  ' : pieces[square.type]
      line = `\x1B[${background};${foreground}m${ascii}\x1B[39;49m` + line
    }
    lines += line + EOL
  }
  return lines
}

const onPressedReturn = () => {
  if (moveSrc === null) {
    moveSrc = cursorPos[0] * 8 + cursorPos[1]
  } else if (moveDst === null) {
    moveDst = cursorPos[0] * 8 + cursorPos[1]
    const move = { src: moveSrc, dst: moveDst }
    if (moveIsLegal(move)) {
      log = chessRules.moveToPgn(position, move)
      position = chessRules.applyMove(position, move)
    } else {
      log = 'ilegal move'
    }
    moveSrc = null
    moveDst = null
  }
}

const moveIsLegal = (move) => {
  const moves = chessRules.getAvailableMoves(position)
  return moves.find(e => e.src === move.src && e.dst === move.dst)
}

// cursor control

keypress(process.stdin)
process.stdin.setRawMode(true)
process.stdin.resume()

process.stdin.on('keypress', function (ch, key) {
  if (key.name === 'up') {
    cursorPos[0] = (cursorPos[0] + 1) % 8
  }
  if (key.name === 'right') {
    cursorPos[1] = (cursorPos[1] + 1) % 8
  }
  if (key.name === 'down') {
    cursorPos[0]--
    if (cursorPos[0] === -1) cursorPos[0] = 7
  }
  if (key.name === 'left') {
    cursorPos[1]--
    if (cursorPos[1] === -1) cursorPos[1] = 7
  }
  if (key.name === 'return') {
    onPressedReturn()
  }
})

// game loop

setInterval(() => {
  console.clear()
  console.log(positionToAscii(position))
  console.log('log:', log)
}, 75)
