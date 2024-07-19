import path from 'node:path'
import { Config, readConfigDirectory } from './config.js'
import { StructError } from 'superstruct'
import pino from 'pino'
import { startServer } from './server.js'
import { getPort } from './environment.js'
import { KubeConfig } from '@kubernetes/client-node'
import { loadKubeConfig } from './kube-config.js'

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

let port: number
try {
  port = getPort()
} catch (error) {
  log.fatal(error, 'config_error')
  process.exit(1)
}

let kubeConfig: KubeConfig
try {
  kubeConfig = loadKubeConfig(log, config)
} catch (error) {
  log.fatal(error, 'config_error')
  process.exit(1)
}

const abortController = new AbortController()
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    log.info({ signal }, 'process_signal')
    abortController.abort()
  })
}

try {
  const close = await startServer({
    log,
    config,
    port,
    kubeConfig
  })

  if (abortController.signal.aborted) {
    await close()
  } else {
    abortController.signal.addEventListener('abort', () => {
      close().then(() => {
        log.info('server_closed')
      }).catch((error) => {
        log.error(error, 'server_close_error')
      })
    })
  }
} catch (error) {
  log.fatal(error, 'uncaught_error')
  process.exit(1)
}
