const Koa = require('koa')
const Router = require('@koa/router')
const bodyParser = require('koa-bodyparser')
const logger = require('koa-logger')
const cors = require('@koa/cors')
const LogClass = require('./logger')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))
const log = new LogClass()
const {
  JSONAPI_CONTENT_TYPE,
  SLACK_BOT_TOKEN_HEADER,
  CHAT_POSTMESSAGE_REQUIRED_FIELDS,
  CHAT_POSTMESSAGE_ALLOWED_FIELDS
} = require('./constants')
const jsonapi = require('./json-api')
const app = new Koa()
const router = new Router()
app.use(bodyParser({
  extendTypes: {
    json: [JSONAPI_CONTENT_TYPE] // will parse application/x-javascript type body as a JSON string
  }
}))
app.use(cors())
app.use(logger((str, [weirdstr, ...args]) => log.shorthand(str, args)))
app.use(jsonapi())

/**
 * Check that the optimizely sdk key header is present.
 * If it isn't throw a 400 error and let the user know
 */
app.use(async (ctx, next) => {
  if (ctx.request.method === 'POST' && !ctx.request.headers[SLACK_BOT_TOKEN_HEADER]) {
    ctx.status = 400
    ctx.state.response.addError('request missing slack bot token')
    ctx.body = ctx.state.response.getResponse()
    return
  }
  await next()
})

app.use(async (ctx, next) => {
  if (ctx.request.method === 'POST' && !validateSlackRequest(ctx.request.body.data, ctx)) {
    ctx.status = 400
    ctx.body = ctx.state.response.getResponse()
    return
  }
  await next()
})

/**
 * Give a generic message for a request to /
 */
router.get('/', async function (ctx) {
  ctx.state.response.status = 200
  ctx.state.response.body = {
    message:
      'Welcome to the slack api microservice.'
  }
})

function validateSlackRequest(data, ctx) {
  const requestParams = Object.keys(data)
  const requiredParams = requestParams.some(p => CHAT_POSTMESSAGE_REQUIRED_FIELDS.indexOf(p) > -1)
  let valid = true;
  requestParams.forEach((field, i) => {
    if ([...CHAT_POSTMESSAGE_ALLOWED_FIELDS, ...CHAT_POSTMESSAGE_REQUIRED_FIELDS].indexOf(field) === -1) {
      delete data[field]
      requestParams.splice(i, 1)
    }
  })
  if (!requiredParams) {
    ctx.state.response.addError('Request missing required fields')
    valid = false
  }
  return valid
}

/**
 * Send a slack message via the chat.postMessage api
 */
router.post('/', async function (ctx) {
  const slockBotToken = ctx.request.headers[SLACK_BOT_TOKEN_HEADER]
  const body = ctx.request.body.data
  try {
    const json = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'post',
      body:    JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${slockBotToken}` },
    }).then(res => res.json())
    ctx.state.response.body = json
    ctx.state.response.status = 201
  } catch (err) {
    ctx.state.response.addError(err)
    ctx.state.response.status = 400
  }
})

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000)
