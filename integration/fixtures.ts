import pino, { BaseLogger } from 'pino'
import { KubeConfig } from '@kubernetes/client-node'
import { startServer } from '../src/server.js'
import { Config, createConfig } from '../src/config.js'

const testServerPort = 3333
const testClusterPort = 56443

const cleanupFunctions: Array<() => Promise<void>> = []

/**
 * Clean up any resources created during tests. This should be called after each test,
 * i.e., in an `afterEach` hook.
 */
export async function cleanup (): Promise<void> {
  for (const cleanupFunction of cleanupFunctions) {
    await cleanupFunction()
  }
  cleanupFunctions.splice(0, cleanupFunctions.length)
}

interface TestServerResult {
  origin: string
}

/**
 * Start a server for integration tests. The server will be closed when `cleanup` is called,
 * which should be done after each test.
 *
 * @returns Information about the server.
 */
export async function startTestServer (options?: {
  config?: (input: Config) => Config
}): Promise<TestServerResult> {
  let config = createConfig()
  if (options?.config != null) {
    config = options.config(config)
  }
  const closeFn = await startServer({
    log: getTestLogger(),
    config,
    port: testServerPort,
    kubeConfig: getTestKubeConfig()
  })
  cleanupFunctions.push(closeFn)
  return {
    origin: `http://127.0.0.1:${testServerPort}`
  }
}

function getTestLogger (): BaseLogger {
  return pino({ level: 'silent' })
}

function getTestKubeConfig (): KubeConfig {
  const kubeConfig = new KubeConfig()
  kubeConfig.loadFromOptions({
    clusters: [
      {
        name: 'test-cluster',
        server: `http://127.0.0.1:${testClusterPort}`
      }
    ],
    contexts: [
      {
        name: 'test-context',
        cluster: 'test-cluster',
        user: 'test-user'
      }
    ],
    users: [
      {
        name: 'test-user'
      }
    ],
    currentContext: 'test-context'
  })
  return kubeConfig
}
