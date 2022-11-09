const crypto = require('hypercore-crypto')
const RAM = require('random-access-memory')
const Hypercore = require('hypercore')
const test = require('brittle')
const { Channel } = require('../chess.js')

test('channel', async t => {
  const a = new Hypercore(RAM, { valueEncoding: 'json' })
  const b = new Hypercore(RAM, { valueEncoding: 'json' })

  await a.ready()
  await b.ready()

  replicate(a, b)

  const channelA = new Channel(a, b)
  const channelB = new Channel(b, a)

  const white = channelA.init ? channelA : channelB
  const black = channelA.init ? channelB : channelA

  const e4 = { src: 12, dst: 28 }
  const e5 = { src: 52, dst: 36 }

  await white.push(e4)
  await wait(200)
  await black.push(e5)
  await wait(200)

  const verified = await verifyGame(a, b)
  t.ok(verified)
})

async function verifyGame (a, b) {
  const verified = true
  const white = Buffer.compare(a.key, b.key) > 0 ? a : b
  const black = Buffer.compare(a.key, b.key) > 0 ? b : a
  for (let i = 0; i < a.length; i++) {
    const data = await white.get(i)
    const signer = i % 2 === 0 ? white.key : black.key
    if (!crypto.verify(Buffer.from(data.data), Buffer.from(data.signature, 'hex'), signer)) return false
  }
  return verified
}

async function replicate (a, b) {
  const as = a.replicate(true)
  const bs = b.replicate(false)

  as.pipe(bs).pipe(as)
}

function wait () {
  return new Promise(resolve => setTimeout(resolve, 200))
}
