import { FastifyReply } from 'fastify'

export async function badRequest (reply: FastifyReply): Promise<FastifyReply> {
  return await reply.code(400).send({ error: 'Bad Request' })
}

export async function forbidden (reply: FastifyReply): Promise<FastifyReply> {
  return await reply.code(403).send({ error: 'Forbidden' })
}

export async function notFound (reply: FastifyReply): Promise<FastifyReply> {
  return await reply.code(404).send({ error: 'Not Found' })
}

export async function payloadTooLarge (reply: FastifyReply): Promise<FastifyReply> {
  return await reply.code(413).send({ error: 'Payload Too Large' })
}

export async function unsupportedMediaType (reply: FastifyReply): Promise<FastifyReply> {
  return await reply.code(415).send({ error: 'Unsupported Media Type' })
}

export async function internalServerError (reply: FastifyReply): Promise<FastifyReply> {
  return await reply.code(500).send({ error: 'Internal Server Error' })
}
