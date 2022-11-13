const test = require('brittle')
const { HyperChess } = require('../chess.js')
const { keyPair } = require('hypercore-crypto')

test('move', async (t) => {
  const a = keyPair()
  const b = keyPair()

  const chess = new HyperChess(a, b.publicKey)
  await chess.ready()

  const commit = chess.move({ src: 12, dst: 28 })

  t.ok(commit)
})

test('remote move', async t => {
  const a = keyPair()
  const b = keyPair()

  const white = new HyperChess(a, b.publicKey)
  const black = new HyperChess(b, a.publicKey)

  await white.ready()
  await black.ready()

  const e4 = { src: 12, dst: 28 }
  const commit = white.move(e4)

  const remoteCommit = await black.remoteMove(commit)
  const position = white.chess.getPosition(true)

  white.state.auth.addSignature(remoteCommit)
  t.ok(white.state.core.append(position))
})

test('scholars mate', async t => {
  const a = keyPair()
  const b = keyPair()

  const white = new HyperChess(a, b.publicKey)
  const black = new HyperChess(b, a.publicKey)

  await white.ready()
  await black.ready()

  let commit
  commit = white.move({ src: 12, dst: 28 }) // e4 e5
  await black.remoteMove(commit)

  commit = black.move({ src: 52, dst: 36 })
  await white.remoteMove(commit)

  commit = white.move({ src: 3, dst: 39 }) // Qh5 Nc6
  await black.remoteMove(commit)

  commit = black.move({ src: 57, dst: 42 })
  await white.remoteMove(commit)

  commit = white.move({ src: 5, dst: 26 }) // Bc4 Nf6??
  await black.remoteMove(commit)

  commit = black.move({ src: 62, dst: 45 })
  await white.remoteMove(commit)

  commit = white.move({ src: 39, dst: 53 }) // Qxf7#
  commit = await black.remoteMove(commit)

  white.state.auth.addSignature(commit)
  await white.state.core.append(white.chess.getPosition(true))

  t.ok(black.chess.inCheck())
  t.is(black.chess.availableMoves().length, 0)
  t.is(black.chess.status(), 'WHITEWON')

  t.is(black.state.core.length, white.state.core.length)
  t.is(black.state.core.length, 7)
})

test('process batch', async t => {
  const a = keyPair()
  const b = keyPair()

  const white = new HyperChess(a, b.publicKey)
  const black = new HyperChess(b, a.publicKey)

  await white.joinGame(black.local.publicKey, black.channelKey.publicKey)
  await black.joinGame(white.local.publicKey, white.channelKey.publicKey)

  await white.ready()
  await black.ready()

  const initialPosition = black.getPosition(true)
  const blocks = [{ op: { src: 12, dst: 28 } }, { op: { src: 52, dst: 36 } }]

  const commitment = await white.processBatch(blocks)
  blocks.push({ commitment })

  await black.processBatch(blocks)
  t.not(black.getPosition(true), initialPosition)
})

test('bad commitment', async t => {
  const a = keyPair()
  const b = keyPair()

  const white = new HyperChess(a, b.publicKey)
  const black = new HyperChess(b, a.publicKey)

  await white.joinGame(black.local.publicKey, black.channelKey.publicKey)
  await black.joinGame(white.local.publicKey, white.channelKey.publicKey)

  await white.ready()
  await black.ready()

  const blocks = [{ op: { src: 12, dst: 28 } }, { op: { src: 52, dst: 36 } }, { commitment: Buffer.alloc(64) }]
  await t.exception(async () => await white.processBatch(blocks))
})

test.solo('2-of-2 game', async t => {
  const createTestnet = require('@hyperswarm/testnet')
  const { bootstrap } = await createTestnet(3)

  const a = new HyperChess({ bootstrap })
  const b = new HyperChess({ bootstrap })

  await a.joinGame(b.local.publicKey, b.channelKey.publicKey)
  await b.joinGame(a.local.publicKey, a.channelKey.publicKey)

  const white = a.firstToPlay ? a : b
  const black = a.firstToPlay ? b : a

  await white.ready()
  await black.ready()

  const e4 = { src: 12, dst: 28 }
  const e5 = { src: 52, dst: 36 }
  const qh5 = { src: 3, dst: 39 }
  const nc6 = { src: 57, dst: 42 }

  await waitAndMove(white, e4)
  await waitAndMove(black, e5)
  await waitAndMove(white, qh5)
  await waitAndMove(black, nc6)

  await wait(1000)

  const finalPosition = 'r1bqkbnr/pppp1ppp/2n5/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR w KQkq - 2 3'
  t.is(white.chess.getPosition(true), finalPosition)
  t.is(black.chess.getPosition(true), finalPosition)

  t.is(white.state.core.length, 4)
  t.is(black.state.core.length, 4)

  t.is(await white.state.core.get(3), finalPosition)
  t.is(await black.state.core.get(3), finalPosition)
})

async function waitAndMove (player, move) {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  player.move(move)
}

function wait (time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}
