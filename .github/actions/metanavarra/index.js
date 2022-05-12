// @ts-nocheck
'use strict'

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
    const response2 = await client.v2.post('tweets', { text })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
