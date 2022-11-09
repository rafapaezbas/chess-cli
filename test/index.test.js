const test = require('brittle')
const { Chess } = require('../chess.js')

test('should get fen positon', ({ is }) => {
  const chess = new Chess()
  const position = chess.getPosition(true)
  is(position, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
})

test('should move e4 and updates position', ({ is, not }) => {
  const chess = new Chess()
  const move = { src: 12, dst: 28 }
  chess.move(move)
  const position = chess.getPosition(true)
  is(position, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')
})

test('ilegal move', ({ is, not }) => {
  const chess = new Chess()
  const moveA = chess.moveIsLegal({ src: 12, dst: 29 })
  const moveB = chess.moveIsLegal({ src: 12, dst: 28 })
  is(moveA, false)
  is(moveB, true)
})

test('Scholars mate', ({ is, ok }) => {
  const chess = new Chess()
  chess.move({ src: 12, dst: 28 }) // e4 e5
  chess.move({ src: 52, dst: 36 })
  chess.move({ src: 3, dst: 39 }) // Qh5 Nc6
  chess.move({ src: 57, dst: 42 })
  chess.move({ src: 5, dst: 26 }) // Bc4 Nf6??
  chess.move({ src: 62, dst: 45 })
  chess.move({ src: 39, dst: 53 }) // Qxf7#

  ok(chess.inCheck())
  is(chess.availableMoves().length, 0)
  is(chess.status(), 'WHITEWON')
})
