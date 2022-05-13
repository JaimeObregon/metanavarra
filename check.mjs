import fs from 'fs'

const fetch = (...args) =>
  // @ts-ignore
  import('node-fetch').then(({ default: fetch }) => fetch(...args))

import { TwitterApi } from 'twitter-api-v2'

if (process.argv.length !== 4) {
  throw new Error(
    'USO: node check.js FICHERO_JSON_ANTERIOR FICHERO_JSON_ACTUAL'
  )
}

const [previous, current] = process.argv
  .slice(-2)
  .map((filename) => {
    const file = fs.readFileSync(filename).toString()
    return JSON.parse(file)
  })
  .map((json) => json.rooms[0].activeParticipants)

console.log({ previous, current })

const {
  TWITTER_CONSUMER_API_KEY: appKey,
  TWITTER_CONSUMER_API_SECRET: appSecret,
  TWITTER_ACCESS_TOKEN: accessToken,
  TWITTER_ACCESS_TOKEN_SECRET: accessSecret,
} = process.env

const client = new TwitterApi({
  appKey,
  appSecret,
  accessToken,
  accessSecret,
})

const text = 'Hola :)'
const response = await client.v2.post('tweets', { text })

console.log(response)
