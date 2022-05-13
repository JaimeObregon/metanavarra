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

const users = {
  '6242c206d3dd2500016583cb': 'El Gobierno de Navarra',
  '6242f0b97aeff10001025a0b': 'El Gobierno de Navarra (propietario)',
  '61b21d6bc92b1b000110003c': 'El administrador 003c',
  '5f72ee5afa7f116d57153fee': 'El administrador 3fee',
}

current.rooms.map(async (room) => {
  const before = room.activeParticipants
  const after = previous.rooms.find(
    (item) => item.id === room.id
  ).activeParticipants

  let text
  if (!before.length && !after.length) {
    text =
      {
        '6246b6964f7a930001a7636a':
          'El espacio «Gobierno de Navarra» está vacío.',
        '6246b7064f7a930001a76375': 'El auditorio está vacío.',
      }[room.id] ?? `La sala ${room.id.slice(-4)} está vacía.`
  } else {
    text = `(${before.length}, ${after.length}) …ha entrado en ${
      {
        '6246b6964f7a930001a7636a': 'el espacio «Gobierno de Navarra»',
        '6246b7064f7a930001a76375': 'el auditorio',
      }[room.id] ?? 'La sala desconocida'
    }`
  }

  let media_ids
  if (false) {
    const avatars = [
      'https://dd2cgqlmnwvp5.cloudfront.net/avatar_generic_bodies/rpm_female_hijab/thumbnail.png',
      'https://dd2cgqlmnwvp5.cloudfront.net/avatar_generic_bodies/rpm_female_hoody/thumbnail.png',
    ]

    media_ids = await Promise.all(
      avatars.map(async (avatar) => {
        const response = await fetch(avatar)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        return client.v1.uploadMedia(buffer, { mimeType: 'image/x-png' })
      })
    )
  }

  const response = await client.v1.tweet(text, { media_ids })

  console.log(response)
})
