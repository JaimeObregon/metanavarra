import util from 'util'

export const users = {
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

export const rooms = {
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

export function concat() {
  const items = this.map((item) => `«${item.replace(/[«»]/g, '"')}»`)

  if (items.length <= 1) {
    return items.toString()
  } else if (items.length === 2) {
    return items.join(' y ')
  }

  return [items.slice(0, items.length - 1).join(', '), items.slice(-1)].join(
    ' y '
  )
}

export function pick() {
  return this[Math.floor(Math.random() * this.length)]
}

// No queremos que entre alguien llamándose @Fulano o #nosequé y eso provoque una
// mención al usuario de Twitter @Fulano o un hashtag. Lo evitamos introduciendo
// un espacio de ancho nulo tras la arroba. Ídem con los enlaces.
export function escape() {
  return this.replace(/([#@])/g, '$1\u200B').replace(/\.([a-z]+)/g, '\u200B.$1')
}

export const debug = (object) => {
  console.log(
    util.inspect(object, { showHidden: false, depth: null, colors: true })
  )
}
