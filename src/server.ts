// this works because 'backend' is listed as a workspace in package.json
import { backend, notFound } from 'backend'

import { fastifyStatic } from '@fastify/static'
import path from 'node:path'
import { fastify } from 'fastify'
import { Config, readConfigDirectory } from './config.js'
import { getPort } from './environment.js'
import { loadKubeConfig } from './kube-config.js'
import { StructError } from 'superstruct'
import { handleError } from './handle-error.js'
import pino from 'pino'

const log = pino({
  level: 'info',
  // do not log pid and hostname
  base: undefined,
  // use ISO strings for timestamps instead of milliseconds
  timestamp: pino.stdTimeFunctions.isoTime,
  // use string levels (e.g., "info") instead of level numbers (e.g., 30)
  formatters: {
    level: (label) => ({ level: label }),
    log: (object) => {
      if (object instanceof Error) {
        return pino.stdSerializers.errWithCause(object)
      }
      return object
    }
  }
})

log.info('process_start')

let config: Config
try {
  config = await readConfigDirectory(path.join(process.cwd(), 'config'))
} catch (error) {
  if (error instanceof StructError) {
    // the value may contain secrets, so don't log it
    error.value = undefined
    error.branch = []
  }
  log.fatal(error, 'config_error')
  process.exit(1)
}

try {
  const port = getPort()
  const kubeConfig = loadKubeConfig(log, config)

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
} catch (error) {
  log.fatal(error, 'uncaught_error')
  process.exit(1)
}
