import fs from 'fs'
import fetch from 'node-fetch'
import { TwitterApi } from 'twitter-api-v2'
import { debug, users, rooms, concat, escape, pick } from './functions.mjs'

process.env.TZ = 'Europe/Madrid'

const hour = new Date().toLocaleTimeString('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
})

const messages = {
  stillEmpty: [
    (room) =>
      `Hay 661.197 navarros en el universo y ninguno en el metaverso. Al menos ${rooms[room].in} a las ${hour}.`,
    (room) =>
      `La metavérsica sala de nombre ${rooms[room].name} está vacía a las ${hour}.`,
    (room) =>
      `Frío como el metaverso vacío: las ${hour} y ${rooms[room].in} no hay nadie.`,
    (room) =>
      `Son las ${hour} y sigue sin haber ningun metanavarro ${rooms[room].in}.`,
    (room) => `No hay nadie ${rooms[room].in}. Son las ${hour}.`,
    (room) => `¡Eco, ecooooooo! Sigue vacío ${rooms[room].long}.`,
    (room) =>
      `Hay amebas con más vida que este metaverso. Son las ${hour} y sigue vacío.`,
    (room) =>
      `Universo 1 - Metaverso 0. Son las ${hour} y esto sigue más aburrido que un surfista en Soria.`,
    (room) =>
      `Las ${hour} y aquí ando en ${rooms[room].long}… más solo que un vegano en una barbacoa.`,
    (room) =>
      `Se ruega a los cero mil cerocientos cibernautas que están ahora mismo en ${rooms[room].long} que mantengan la distancia de seguridad. ${hour}.`,
    (room) =>
      `«La soledad es la suerte de todos los espíritus excelentes»\n— Arthur Schopenhauer.\n\nEntonces a mí me ha tocado la lotería, porque son las ${hour} y en ${rooms[room].long} del metaverso no hay nadie.`,
    (room) => `Estoy en ${rooms[room].long} y aquí no hay ni Perry. ${hour}.`,
    (room) => `🥱💤. Ni Blas en ${rooms[room].long} a las ${hour}.`,
    (room) =>
      `¡Al fondo hay sitio! Y al frente. Y a los lados. Porque está vacío ${rooms[room].long}. Son las ${hour}`,
    (room) =>
      `«A mis soledades voy\nde mis soledades vengo,\nporque para andar conmigo\nme bastan mis pensamientos».\n— Lope de Vega, desde el metaverso.\nSon las ${hour} y ${rooms[room].long} está lleno de… metavacío.`,
    (room) =>
      `🎵 Ella despidió a su amooor\nEl partió en un barco\nen el muelle de San Blaaas 🎶\nEl juró que volvería…\n🎶 Y empapada en llanto,\nella juró que esperaría…\nMiles de lunas pasaron 🎵\nY siempre ella estaba en el muelle,\nesperandoooo… 🎶🎵\n\nAsí estoy yo en el Metaverso: solo y esperando a las ${hour} en ${rooms[room].long}…`,
  ],
  entered: [
    (users, room) =>
      users.length === 1
        ? `${users.concat()} is in da house! 🕺`
        : `${users.concat()} are in da house! ${Array(users.length)
            .fill('🕺')
            .join('')}`,
    (users, room) =>
      `📣 EL METAVERSO INFORMA: ${
        users.length === 1
          ? `${users.concat()} ha llegado ${rooms[room].to}.`
          : `${users.concat()} han llegado ${rooms[room].to}.`
      }`,
    (users, room) =>
      `${Array(users.length)
        .fill('👋')
        .join('')} ¡Demos la bienvenida a ${users.concat()} ${rooms[room].to}!`,
  ],
  left: [
    (users, room) =>
      `Es con gran congoja que os informo de la marcha de ${users.concat()} ${
        rooms[room].from
      }.`,
    (users, room) =>
      `${
        users.length === 1
          ? `${users.concat()} ha abandonado`
          : `${users.concat()} han abandonado`
      } el metaverso en dirección al universo.`,
  ],
  enteredAndLeft: [
    (entered, left, room) =>
      [
        entered.length === 1
          ? `¡${entered.concat()} ha llegado ${rooms[room].to}!`
          : `¡${entered.concat()} han llegado ${rooms[room].to}!`,
        left.length === 1
          ? `${left.concat()} ha partido.`
          : `${left.concat()} han partido.`,
      ].join(' Y '),
  ],
  unchanged: [
    (room) =>
      `Todo cambia. Menos ${rooms[room].long}, donde a las ${hour} no ha entrado ni salido nadie.`,
  ],
}

Object.defineProperty(Array.prototype, 'concat', { value: concat })
Object.defineProperty(Array.prototype, 'pick', { value: pick })
Object.defineProperty(String.prototype, 'escape', { value: escape })

if (process.argv.length !== 4) {
  throw new Error(
    'USO: node check.js FICHERO_JSON_ANTERIOR FICHERO_JSON_ACTUAL'
  )
}

const parseUser = (user) => {
  const image = user.profilePicURL

  if (users[user.id]) {
    const name = users[user.id]
    return { name, image }
  }

  const hash = user.id.slice(-4)
  const alias = /female/.test(user.profilePicURL)
    ? `Anónima ${hash}`
    : `Anónimo ${hash}`

  const maxLength = 18
  const trimmed =
    user.displayName.length <= maxLength
      ? user.displayName.slice(0, maxLength)
      : `${user.displayName.slice(0, maxLength)}…`

  const name = trimmed || alias

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

  const entered = after
    .map((user) => user.id)
    .filter((item) => !before.map((user) => user.id).includes(item))

  const left = before
    .map((user) => user.id)
    .filter((item) => !after.map((user) => user.id).includes(item))

  if (!entered.length && !left.length && before.length && after.length) {
    // Nadie ha entrado ni salido de la sala, pero hay gente
    const message = messages.unchanged.pick()(room.id)
    const images = []
    tweets.push({ message, images })
  } else if (entered.length && !left.length) {
    // Ha habido entradas
    const users = after.filter((user) => entered.includes(user.id))
    const message = messages.entered.pick()(
      users.map((user) => parseUser(user).name),
      room.id
    )
    const images = users.map((user) => parseUser(user).image)
    tweets.push({ message, images })
  } else if (!entered.length && left.length) {
    // Ha habido salidas
    const users = before.filter((user) => left.includes(user.id))
    const message = messages.left.pick()(
      users.map((user) => parseUser(user).name),
      room.id
    )
    const images = users.map((user) => parseUser(user).image)
    tweets.push({ message, images })
  } else if (entered.length && left.length) {
    // Ha habido entradas y salidas
    const users1 = after.filter((user) => entered.includes(user.id))
    const users2 = before.filter((user) => left.includes(user.id))
    const message = messages.enteredAndLeft.pick()(
      users1.map((user) => parseUser(user).name),
      users2.map((user) => parseUser(user).name),
      room.id
    )
    const images = [...users1, ...users2].map((user) => parseUser(user).image)
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
  const tweetsWithImages = tweets.filter((tweet) => tweet.images.length)

  const { message, images } = tweetsWithImages.length
    ? tweetsWithImages.pick()
    : tweets.pick()

  debug({ message, images })

  const media_ids = await Promise.all(
    images
      .filter((avatar) => /\.png$/.test(avatar))
      .slice(0, 4)
      .map(async (avatar) => {
        const response = await fetch(avatar)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        return client.v1.uploadMedia(buffer, { mimeType: 'image/x-png' })
      })
  )

  const escaped = message.escape()

  // Esto no es correcto, pero es suficientemente válido
  // https://developer.twitter.com/en/docs/counting-characters
  // No apuro los 280 caracteres debido a esta imprecisión,
  // y para las dos posiciones del `…` en caso de elipsis.
  const maxLength = 270

  const text =
    escaped.length > maxLength ? `${escaped.slice(0, maxLength)}…` : escaped

  try {
    await client.v1.tweet(text, { media_ids })
    process.exit()
  } catch (error) {
    debug(error.data.errors[0].message)
    tweets = tweets.filter((tweet) => tweet.message !== message)
  }
} while (tweets.length)
