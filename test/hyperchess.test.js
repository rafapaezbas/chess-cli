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

test('remote move', async (t) => {
  const a = keyPair()
  const b = keyPair()

  const white = new HyperChess(a, b.publicKey)
  await white.ready()

  const black = new HyperChess(b, a.publicKey)
  await black.ready()

  const e4 = { src: 12, dst: 28 }
  const commit = white.move(e4)

  const remoteCommit = black.remoteMove(commit)
  const position = white.chess.getPosition(true)

  white.state.auth.addSignature(remoteCommit)
  t.ok(white.state.core.append(position))
})
