const test = require('brittle')
const Chess = require('..')

test('should get fen positon', ({ is }) => {
    const chess = new Chess()
    const position = chess.getPosition(true)
    is(position, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
})

test('should move e4', ({ is, not }) => {
    const chess = new Chess()
    chess.move(12, 28)
    const position = chess.getPosition(true)
    is(position, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1')
})

test('ilegal move', ({ is, not }) => {
    const chess = new Chess()
    const moveA = chess.moveIsLegal({ src: 12, dst: 29})
    const moveB = chess.moveIsLegal({ src: 12, dst: 28})
    is(moveA, false)
    is(moveB, true)
})
