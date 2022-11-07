## Chess-cli

Javascript chess cli.

__♟ ♜ ♞ ♝ ♛ ♚__ 

![chess board](https://user-images.githubusercontent.com/15270736/200165619-38aa138e-e29e-4422-8ba2-03205a9f2627.png)

```
npm install -g @rafapaezbas/chess-cli
chess-cli
```

## How to play.

Control the cursor with arrows. Select piece with `return` key.

## Api

```
const Chess = require('@rafapaezbas/chess-cli')
const chess = new Chess()
```

### getPosition(fen = false)

```
const jsonPosition = chess.getPosition()
const fenPosition = chess.getPosition(true)
```

### move({ src, dst })

```
chess.getPosition({ src:12, dst:28 }) // e4
```

### moveIsLegal({ src, dst })

```
// inital position
const isLegal = chess.moveIsLegal({ src:12, dst:28 }) // true
```

### start()

Starts key controls and rules of movements to cursor control.

```
chess.start()
```

