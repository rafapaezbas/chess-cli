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

test('move and commit', async t => {
  const a = keyPair()
  const b = keyPair()

  const white = new HyperChess(a, b.publicKey)
  const black = new HyperChess(b, a.publicKey)

  white.joinGame(black.local.publicKey, black.channelKey.publicKey)
  black.joinGame(white.local.publicKey, white.channelKey.publicKey)

  await white.ready()
  await black.ready()

  const initialPosition = white.getPosition(true)

  const moves = [{ src: 12, dst: 28 }, { src: 52, dst: 36 }]
  const commit = white.commit(moves)

  t.is(white.getPosition(true), initialPosition)
  t.ok(commit)
})
