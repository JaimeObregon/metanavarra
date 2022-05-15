# El portero del metaverso

El Gobierno de Navarra [se ha instalado en el metaverso](https://www.navarra.es/es/-/el-gobierno-de-navarra-presenta-su-nuevo-espacio-en-el-metaverso-que-nace-para-estimular-la-innovacion-y-abrir-nuevas-vias-de-comunicacion). Pero algunos ya estamos hartitos de unos servicios públicos llenos de _inteligencia artificial_, ciudades _smart_ y ahora _metaversos_ chirripitifláuticos… mientras los trámites digitales más elementales siguen siendo una yincana kafkiana.

[Ve aquí el vídeo explicativo](https://twitter.com/JaimeObregon/status/1525510124353241093) de este proyecto personal de Jaime Gómez-Obregón.

![Meme de @javidcf: tenemos metaversos, pero no cosas esenciales como un buscador en el Boletín Oficial del Registro Mercantil (BORME)](/meme.jpg)

# Descripción técnica

Este repositorio despliega [una tarea programada](/.github/workflows/fetch.yml) (GitHub Actions) que cada pocos minutos consulta la API de la plataforma del metaverso más foral de la galaxia (Spatial) y hace un _commit_ con la respuesta, que quedan así conservadas en [`/responses`](/responses).

Estas respuestas son una «fotografía instantánea» del estado general del metaverso del Gobierno de Navarra en un momento dado, y pueden utilizarse posteriormente para hacer análisis y extraer información de interés.

En paralelo, la tarea programada alimenta un bot de Twitter: [`@metanavarra`](https://twitter.com/metanavarra), que de manera divertida comparte en la red social las entradas y salidas de usuarios y el estado de las dos salas habilitadas por el Gobierno de Navarra:

| `roomId` en Spatial      | Nombre de la sala del metaverso  |
| ------------------------ | -------------------------------- |
| 6246b6964f7a930001a7636a | El espacio «Gobierno de Navarra» |
| 6246b7064f7a930001a76375 | El auditorio                     |

El bot de Twitter hace [una interpretación cómica](/check.mjs) de los datos únicamente como divertimento, y no debe emplearse para el análisis. Para esto último están los datos en [`/responses`](/responses).

El directorio `node_modules` es requisito para las `actions` de GitHub, y por eso forma parte del repositorio.
