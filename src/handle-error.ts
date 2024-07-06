import { FastifyError, FastifyReply } from 'fastify'
import { badRequest, internalServerError, payloadTooLarge, unsupportedMediaType } from 'backend'

/**
 * The error handling function that is used. This should be bound before registering any routes to handle their errors
 * properly.
 *
 * @param error The error that occurred.
 * @param reply The response object.
 */
export async function handleError (error: FastifyError, reply: FastifyReply): Promise<void> {
  // JSON input error (thrown during parsing of the request body)
  if (error instanceof SyntaxError && error.statusCode != null && error.statusCode < 500) {
    return await badRequest(reply)
  }

  // Fastify content type parser errors
  switch (error.code) {
    case 'FST_ERR_CTP_BODY_TOO_LARGE':
      return await payloadTooLarge(reply)
    case 'FST_ERR_CTP_INVALID_TYPE':
    case 'FST_ERR_CTP_EMPTY_TYPE':
    case 'FST_ERR_CTP_INVALID_MEDIA_TYPE':
      return await unsupportedMediaType(reply)
    case 'FST_ERR_CTP_INVALID_CONTENT_LENGTH':
    case 'FST_ERR_CTP_EMPTY_JSON_BODY':
      return await badRequest(reply)
  }

  // Internal server error
  reply.log.error(error, 'request_error')
  return await internalServerError(reply)
}
