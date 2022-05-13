import fs from 'fs'

const rooms = {
  '6246b6964f7a930001a7636a': 'Espacio Gobierno de Navarra',
  '6246b7064f7a930001a76375': 'Auditorio',
}

const fetch = (...args) =>
  // @ts-ignore
  import('node-fetch').then(({ default: fetch }) => fetch(...args))

import { TwitterApi } from 'twitter-api-v2'

if (process.argv.length !== 4) {
  throw new Error(
    'USO: node check.js FICHERO_JSON_ANTERIOR FICHERO_JSON_ACTUAL'
  )
}

const [previous, current] = process.argv.slice(-2).map((filename) => {
  const file = fs.readFileSync(filename).toString()
  return JSON.parse(file)
})

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

current.rooms.map(async (room) => {
  const text = `${room.name} (${room.id})`

  const avatars = [
    'https://dd2cgqlmnwvp5.cloudfront.net/avatar_generic_bodies/rpm_female_hijab/thumbnail.png',
    'https://dd2cgqlmnwvp5.cloudfront.net/avatar_generic_bodies/rpm_female_hoody/thumbnail.png',
  ]

  const media_ids = await Promise.all(
    avatars.map(async (avatar) => {
      const response = await fetch(avatar)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      return client.v1.uploadMedia(buffer, { mimeType: 'image/x-png' })
    })
  )

  const response = await client.v1.tweet(text, { media_ids })

  console.log(response)
})
