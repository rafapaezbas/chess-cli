import { EOL } from 'os'
import chessRules from 'chess-rules'
import keypress from 'keypress'
import { Chess, HyperChess } from '../chess.js'
import ChessCli from '../chess-cli.js'
import crypto from 'hypercore-crypto'

const chess = new Chess()
const chessCli = new ChessCli()
const cursorPos = [0, 0]

const topPadding = 1
const leftPadding = 2
const padding = ' '

let log = ''
let moveSrc = null
let moveDst = null

const keyPairFlag = process.argv[2] === '--keyPair'
if (keyPairFlag) {
  const keyPair = crypto.keyPair()
  console.log('pk:', keyPair.publicKey.toString('hex'))
  console.log('sk', keyPair.secretKey.toString('hex'))
  process.exit(0)
}

const keys = process.argv[2].split(':')
const localPk = keys[0]
const localSk = keys[1]
const remote = keys[2]
const hyperChess = new HyperChess(chess, { publicKey: Buffer.from(localPk, 'hex'), secretKey: Buffer.from(localSk, 'hex') },
  { publicKey: Buffer.from(remote, 'hex') })
await hyperChess.ready()
hyperChess.on('move', () => render())

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
  if (key.name === 'q') {
    process.exit(0)
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
      hyperChess.move(move)
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
