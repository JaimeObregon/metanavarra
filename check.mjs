import fs from 'fs'
import { TwitterApi } from 'twitter-api-v2'
import fetch from 'node-fetch'
import util from 'util'

process.env.TZ = 'Europe/Madrid'

const users = {
  '6242c206d3dd2500016583cb': {
    name: 'Gobierno de Navarra',
    long: 'El Gobierno de Navarra',
  },
  '6242f0b97aeff10001025a0b': {
    name: 'Gobierno de Navarra (propietario)',
    long: 'El Gobierno de Navarra (propietario)',
  },
  '61b21d6bc92b1b000110003c': {
    name: 'Administrador 003c',
    long: 'El administrador 003c',
  },
  '5f72ee5afa7f116d57153fee': {
    name: 'Administrador 3fee',
    long: 'El administrador 3fee',
  },
}

const rooms = {
  '6246b6964f7a930001a7636a': {
    name: 'Espacio «Gobierno de Navarra»',
    long: 'el espacio «Gobierno de Navarra»',
    from: 'del espacio «Gobierno de Navarra»',
    in: 'en el espacio «Gobierno de Navarra»',
    to: 'al espacio «Gobierno de Navarra»',
  },
  '6246b7064f7a930001a76375': {
    name: 'Auditorio',
    long: 'el Auditorio',
    from: 'del Auditorio',
    in: 'en el Auditorio',
    to: 'al Auditorio',
  },
}

const messages = {
  empty: [
    (room) =>
      `Hay 661.197 navarros en el universo y ninguno en el metaverso. Al menos ${rooms[room].in} a las ${hour}.`,
    (room) =>
      `La metavérsica sala de nombre ${rooms[room].name} está vacía a las ${hour}.`,
    (room) =>
      `Frío como el metaverso vacío: las ${hour} y ${rooms[room].in} no hay nadie.`,
  ],
  stillEmpty: [
    (room) =>
      `Son las ${hour} y sigue sin haber ningun metanavarro ${rooms[room].in}.`,
    (room) => `No hay nadie ${rooms[room].in}. Son las ${hour}.`,
  ],
  entered: [
    (users, room) =>
      users.length === 1
        ? `${users[0]} is in da house! 🕺`
        : `${users.concat()} are in da house! ${Array(users.length)
            .fill('🕺')
            .join('')}`,
    (users, room) =>
      `📣 EL METAVERSO INFORMA: ${
        users.length === 1
          ? `${users[0]} ha llegado ${rooms[room].to}.`
          : `${users.concat()} han llegado ${rooms[room].to}.`
      }`,
    (users, room) =>
      `${Array(users.length)
        .fill('👋')
        .join('')} ¡Demos la bienvenida a ${users.concat()} a ${
        rooms[room].to
      }!`,
  ],
  left: [
    (users, room) =>
      `Es con gran congoja que os informo de la marcha de ${users.concat()} ${
        rooms[room].from
      }.`,
  ],
  enteredAndLeft: [
    (entered, left, room) =>
      [
        entered.length === 1
          ? `¡${entered[0]} ha llegado!`
          : `¡${entered.concat()} han llegado!`,
        left.length === 1
          ? `${left[0]} ha partido.`
          : `${left.concat()} han partido.`,
      ].join(' Y '),
  ],
  unchanged: [
    (room) =>
      `Todo cambia. Menos ${rooms[room].long}, donde a las ${hour} no ha entrado ni salido nadie.`,
  ],
}

Object.defineProperty(Array.prototype, 'concat', {
  value: function () {
    if (this.length <= 1) {
      return this.toString()
    } else if (this.length === 2) {
      return this.join(' y ')
    }

    return [this.slice(0, this.length - 1).join(', '), this.slice(-1)].join(
      ' y '
    )
  },
})

Object.defineProperty(Array.prototype, 'pick', {
  value: function () {
    return this[Math.floor(Math.random() * this.length)]
  },
})

Object.defineProperty(String.prototype, 'escape', {
  // No queremos que alguien entre llamándose @Fulano y eso provoque una mención
  // al usuario de Twitter @Fulano. Lo evitamos introduciendo un espacio de ancho
  // nulo tras la arroba. Ídem con los enlaces.
  value: function () {
    return this.replace(/([@\.])/g, '$1U+200B')
  },
})

const hour = new Date().toLocaleTimeString('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
})

if (process.argv.length !== 4) {
  throw new Error(
    'USO: node check.js FICHERO_JSON_ANTERIOR FICHERO_JSON_ACTUAL'
  )
}

const debug = (object) => {
  console.log(
    util.inspect(object, { showHidden: false, depth: null, colors: true })
  )
}

const parseUser = (user) => {
  const image = user.profilePicURL

  if (users[user.id]) {
    const name = users[user.id]
    return { name, image }
  }

  const alias = /female/.test(user.profilePicURL)
    ? 'Una usuaria anónima'
    : 'Un usuario anónimo'

  const name = user.displayName || alias

  return { name, image }
}

const [previous, current] = process.argv.slice(-2).map((filename) => {
  const file = fs.readFileSync(filename).toString()
  return JSON.parse(file)
})

debug({ previous, current })

let tweets = []

current.rooms.forEach((room) => {
  const after = room.activeParticipants
  const before = previous.rooms.find((r) => r.id === room.id).activeParticipants

  const entered = after.filter((item) => !before.includes(item)).map(parseUser)
  const left = before.filter((item) => !after.includes(item)).map(parseUser)

  if (!entered.length && !left.length) {
    // Nadie ha entrado ni salido de la sala
    const message = messages.unchanged.pick()(room.id)
    const images = []
    tweets.push({ message, images })
  } else if (entered.length && !left.length) {
    // Ha habido entradas
    const message = messages.entered.pick()(
      entered.map((user) => user.name),
      room.id
    )
    const images = entered.map((user) => user.image)
    tweets.push({ message, images })
  } else if (!entered.length && left.length) {
    // Ha habido salidas
    const message = messages.left.pick()(
      left.map((user) => user.name),
      room.id
    )
    const images = left.map((user) => user.image)
    tweets.push({ message, images })
  } else if (entered.length && left.length) {
    // Ha habido entradas y salidas
    const message = messages.enteredAndLeft.pick()(
      entered.map((user) => user.name),
      left.map((user) => user.name),
      room.id
    )
    const images = [
      ...entered.map((user) => user.image),
      ...left.map((user) => user.image),
    ]
    tweets.push({ message, images })
  }

  if (!before.length && !after.length) {
    // La sala sigue vacía
    const message = messages.stillEmpty.pick()(room.id)
    const images = []
    tweets.push({ message, images })
  }
  if (before.length && !after.length) {
    // La sala ha quedado vacía
  } else if (!before.length && after.length) {
    // La sala ya no está vacía
  } else if (before.length && after.length) {
    // Había gente antes y sigue habiéndola,
    // aunque no tienen por qué ser los mismos
  }
})

debug(tweets)

if (!tweets.length) {
  process.exit()
}

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

do {
  const { message, images } = tweets.pick()

  debug({ message, images })

  const media_ids = await Promise.all(
    images.slice(0, 4).map(async (avatar) => {
      const response = await fetch(avatar)
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      return client.v1.uploadMedia(buffer, { mimeType: 'image/x-png' })
    })
  )

  // No es correcto, pero es suficientemente válido
  // https://developer.twitter.com/en/docs/counting-characters
  const text = message.slice(0, 280)

  try {
    await client.v1.tweet(text, { media_ids })
    process.exit()
  } catch (error) {
    debug(error.data.errors[0].message)
    tweets = tweets.filter((tweet) => tweet.message !== message)
  }
} while (tweets.length)
