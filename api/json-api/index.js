const { JSONAPI_CONTENT_TYPE } = require('../constants')
const JsonApiResponse = require('./response')

/**
 * Enforce JSONAPI standards
 * https://jsonapi.org/format/
 */
module.exports = () => async (ctx, next) => {
  const response = new JsonApiResponse()
  if (ctx.request.headers['content-type'] !== JSONAPI_CONTENT_TYPE) {
    response.addError(`Content-Type must be ${JSONAPI_CONTENT_TYPE}`)
    ctx.status = 400
    ctx.body = response.getResponse()
    return
  }
  if (ctx.request.method === 'POST' && !ctx.request.body && !ctx.request.body.data && typeof ctx.request.body.data !== 'object') {
    response.addError(`Request body must be formatted { data: {/* request body */} }`)
    ctx.status = 400
    ctx.body = response.getResponse()
    return
  }
  ctx.state.response = response
  await next(ctx)
  ctx.status = ctx.state.response.status
  ctx.response.body = ctx.state.response.getResponse()
  ctx.response.set({ 'Content-Type': JSONAPI_CONTENT_TYPE })
}
