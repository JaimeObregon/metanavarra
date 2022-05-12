// @ts-nocheck
'use strict'

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args))

function getInput(name, { mandatory, defaultValue } = {}) {
  const input = core.getInput(name) || defaultValue
  if (!input && mandatory === true) {
    throw new Error(`${name} is a required input`)
  }
  return input
}

function getEnv(name, { mandatory, defaultValue } = {}) {
  const env = process.env[name]
  if (!env && mandatory === true) {
    throw new Error(`${name} is a required environment variable`)
  }
  return env
}

const core = require('@actions/core')
const { TwitterApi } = require('twitter-api-v2')

async function run() {
  try {
    const tweet = getInput('tweet-message', { mandatory: true })

    const response = getInput('response', { mandatory: true })
    const json = JSON.parse(response)

    const { activeParticipants } = json.rooms[0]
    const names = activeParticipants.map(
      (participant) => participant.displayName || 'Anónimo'
    )
    console.log(names)

    const tweetLength = getInput('length', { defaultValue: 280 })
    if (tweet.length > tweetLength) {
      throw new Error(`Tweet is too long. Max length is ${tweetLength}`)
    }

    const consumerKey = getEnv('TWITTER_CONSUMER_API_KEY', { mandatory: true })
    const consumerSecret = getEnv('TWITTER_CONSUMER_API_SECRET', {
      mandatory: true,
    })
    const accessToken = getEnv('TWITTER_ACCESS_TOKEN', { mandatory: false })
    const accessTokenSecret = getEnv('TWITTER_ACCESS_TOKEN_SECRET', {
      mandatory: false,
    })

    const client = new TwitterApi({
      appKey: consumerKey,
      appSecret: consumerSecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    })

    const text = names.join(', ') + ' ' + new Date().toString()

    const res = await fetch(
      'https://dd2cgqlmnwvp5.cloudfront.net/avatar_generic_bodies/rpm_male_tshirt/thumbnail.png'
    )

    if (!res.ok) {
      console.log('!res.ok')
    }

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const media_ids = await Promise.all([
      client.v1.uploadMedia(buffer, { mimeType: 'image/x-png' }),
    ])

    const response2 = await client.v2.post('tweets', { text, media_ids })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
