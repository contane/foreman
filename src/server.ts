// this works because 'backend' is listed as a workspace in package.json
import { backend, notFound } from 'backend'

import { fastifyStatic } from '@fastify/static'
import path from 'node:path'
import { fastify } from 'fastify'
import { Config } from './config.js'
import { KubeConfig } from '@kubernetes/client-node'
import { handleError } from './handle-error.js'
import { BaseLogger } from 'pino'

type CloseFunction = () => Promise<void>

export async function startServer (options: {
  log: BaseLogger
  config: Config
  port: number
  kubeConfig: KubeConfig
}): Promise<CloseFunction> {
  const { log, config, port, kubeConfig } = options

  const app = fastify({
    logger: log
  })

  app.setErrorHandler(async (error, req, reply) => await handleError(error, reply))

  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), 'frontend/dist'),
    index: 'index.html',
    setHeaders: (res) => {
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
      void res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
      // https://infosec.mozilla.org/guidelines/web_security#x-frame-options
      void res.setHeader('X-Frame-Options', 'DENY')
      // https://infosec.mozilla.org/guidelines/web_security#x-content-type-options
      void res.setHeader('X-Content-Type-Options', 'nosniff')
      // https://infosec.mozilla.org/guidelines/web_security#referrer-policy
      void res.setHeader('Referrer-Policy', 'no-referrer')
    }
  })

  await app.register(backend(kubeConfig, {
    cronJob: config.cronJob,
    cookies: config.cookies,
    auth: config.auth,
    gitlab: config.gitlab
  }), { prefix: '/api' })

  // Serve the frontend for all paths besides the API (SPA)
  app.setNotFoundHandler(async (req, reply) => {
    if (!req.url.startsWith('/api/') && (req.method === 'GET' || req.method === 'HEAD')) {
      return await reply.sendFile('index.html')
    }
    return await notFound(reply)
  })

  await app.listen({ port, host: '::' })

  return async () => {
    await app.close()
  }
}
