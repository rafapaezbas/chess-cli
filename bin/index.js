const { EOL } = require('os')
const chessRules = require('chess-rules')
const keypress = require('keypress')
const { HyperChess } = require('../chess.js')
const ChessCli = require('../chess-cli.js')

const player = new HyperChess()

console.log(player.local.publicKey.toString('hex') + ':' + player.channelKey.publicKey.toString('hex'))

process.stdin.once('data', async data => {
  await player.joinGame(...data.toString().trim().split(':').map(b => Buffer.from(b, 'hex')))

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

  let count = 0

  player.on('update', move => {
    console.log(player.firstToPlay)
    log = (count++ & 1 ^ player.firstToPlay ? 'We' : 'Peer') + ' played: ' + move
    render()
  })

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

    console.log('Playing as', player.firstToPlay ? 'white' : 'black')

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
      log = 'We played: ' + chessRules.moveToPgn(player.chess.position, move)

      player.move(move)

      moveSrc = null
      moveDst = null
    }
  }

  function positionAndPadding () {
    return chessCli.positionToAscii(player.getPosition(true), cursorPos)
      .split(EOL).map(e => padding.repeat(leftPadding) + e).join(EOL)
  }
})
