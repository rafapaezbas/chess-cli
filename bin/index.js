const { EOL } = require('os')
const chessRules = require('chess-rules')
const keypress = require('keypress')
const { Chess } = require('../chess.js')
const ChessCli = require('../chess-cli.js')

const chess = new Chess()
const chessCli = new ChessCli()
const cursorPos = [0, 0]

const topPadding = 1
const leftPadding = 2
const padding = ' '

let log = ''
let moveSrc = null
let moveDst = null

keypress(process.stdin)
process.stdin.setRawMode(true)
process.stdin.resume()
render()

process.stdin.on('keypress', (_, key) => {
  if (key.name === 'up') {
    cursorPos[0] = ++cursorPos[0] % 8
  }
  if (key.name === 'right') {
    cursorPos[1] = ++cursorPos[1] % 8
  }
  if (key.name === 'down') {
    cursorPos[0] = --cursorPos[0] % 8 & 7
  }
  if (key.name === 'left') {
    cursorPos[1] = --cursorPos[1] % 8 & 7
  }
  if (key.name === 'return') {
    onPressedReturn()
  }
  render()
})

function render () {
  console.clear()
  const position = positionAndPadding()
  for (let i = 0; i < topPadding; i++) console.log('')
  console.log(position)
  console.log('log:', log)
}

function onPressedReturn () {
  if (moveSrc === null) {
    moveSrc = cursorPos[0] * 8 + cursorPos[1]
  } else {
    moveDst = cursorPos[0] * 8 + cursorPos[1]
    const move = { src: moveSrc, dst: moveDst }
    if (chess.moveIsLegal(move)) {
      log = chessRules.moveToPgn(chess.position, move)
      chess.move(move)
    } else {
      log = 'ilegal move'
    }
    moveSrc = null
    moveDst = null
  }
}

function positionAndPadding () {
  return chessCli.positionToAscii(chess.getPosition(true), cursorPos)
    .split(EOL).map(e => padding.repeat(leftPadding) + e).join(EOL)
}
