import k8s from '@kubernetes/client-node'
import { KubernetesApi } from './kubernetes/api.js'
import { cronjobRoute } from './api/cronjob.js'
import { podLogsRoute } from './api/pod-logs.js'
import { jobsRoute } from './api/jobs.js'
import { jobPodsRoute } from './api/job-pods.js'
import { createControllers } from './controllers.js'
import { triggerRoute } from './api/trigger.js'
import { FastifyPluginAsync } from 'fastify'
import { fastifySecureSession } from '@fastify/secure-session'
import fastifyPassport from '@fastify/passport'
import { randomBytes } from 'node:crypto'
import { meAuthRoute } from './api/auth/me.js'
import { localLoginAuthRoute } from './api/auth/local-login.js'
import { logoutAuthRoute } from './api/auth/logout.js'
import { podProgressRoute } from './api/pod-progress.js'
import { getAvailableMemory } from './util/system.js'
import { oidcAuthRoute } from './api/auth/oidc.js'
import { makeLocalStrategy } from './auth/local-strategy.js'
import { makeOidcStrategy } from './auth/oidc-strategy.js'
import { AuthStrategy, User } from './auth/common.js'
import { strategiesAuthRoute } from './api/auth/strategies.js'
import { BackendConfig } from './backend-config.js'

export type { BackendConfig } from './backend-config.js'
export * from './api/errors.js'

export const backend = (kubeConfig: k8s.KubeConfig, config: BackendConfig): FastifyPluginAsync => async (app) => {
  // Note: NEVER log the config here, as it contains the admin password!
  app.log.info('backend_init')

  const api = await KubernetesApi.create(app.log, { kubeConfig })
  const controllers = createControllers(api, config)

  // If no key is provided, generate a new key each time.
  if (config.cookies.key == null) {
    app.log.warn('cookie_key_random_generation')
    // Key generation needs at least 256 MiB of free memory, which can be problematic in containerized environments.
    const requiredMemory = 256 * 1024 * 1024
    const availableMemory = getAvailableMemory()
    if (availableMemory != null && availableMemory < requiredMemory) {
      throw new Error(`Cookie key generation requires at least 256 MiB of free memory. Memory available: ${availableMemory.toLocaleString('en-US')} bytes.`)
    }
  }
  const keyOptions = config.cookies.key != null
    ? { key: config.cookies.key }
    : { secret: randomBytes(32), salt: randomBytes(16) }

  await app.register(fastifySecureSession, {
    ...keyOptions,
    cookie: {
      // the cookie is scoped to the API, so that it's not sent with requests to static files
      path: app.prefix,
      // do not allow JavaScript to access the cookie
      httpOnly: true,
      // if the request was made via HTTPS, the cookie should only be sent via HTTPS in future requests
      secure: 'auto',
      maxAge: config.cookies.maxAge / 1000
    }
  })
  await app.register(fastifyPassport.initialize())
  await app.register(fastifyPassport.secureSession())

  fastifyPassport.registerUserSerializer(async (user: User) => user)
  fastifyPassport.registerUserDeserializer(async (user: User) => {
    // From https://github.com/fastify/fastify-passport:
    // "if a deserializer returns null or false, @fastify/passport interprets that as a missing but expected user, and
    // resets the session to log the user out"
    if (!Number.isSafeInteger(user.createdAt) || user.createdAt + config.cookies.maxAge < Date.now()) {
      return null
    }
    return user
  })

  const enabledAuthStrategies = []

  if (config.auth.local.enabled) {
    if (config.auth.local.password.trim().length === 0) {
      throw new Error('Local auth password must not be empty.')
    }
    enabledAuthStrategies.push(AuthStrategy.LOCAL)
    fastifyPassport.use(AuthStrategy.LOCAL, await makeLocalStrategy({
      username: config.auth.local.username,
      password: config.auth.local.password
    }))
  }

  if (config.auth.oidc.enabled) {
    enabledAuthStrategies.push(AuthStrategy.OIDC)
    fastifyPassport.use(AuthStrategy.OIDC, await makeOidcStrategy({
      ...config.auth.oidc,
      redirectUri: new URL(`${app.prefix}/auth/oidc/callback`, config.auth.oidc.publicUrl).toString()
    }))
  }

  await app.register(strategiesAuthRoute(enabledAuthStrategies), { prefix: '/auth/strategies' })
  await app.register(meAuthRoute(), { prefix: '/auth/me' })
  await app.register(logoutAuthRoute(), { prefix: '/auth/logout' })
  if (enabledAuthStrategies.includes(AuthStrategy.LOCAL)) {
    await app.register(localLoginAuthRoute(), { prefix: '/auth/local' })
  }
  if (enabledAuthStrategies.includes(AuthStrategy.OIDC)) {
    await app.register(oidcAuthRoute(), { prefix: '/auth/oidc' })
  }

  await app.register(cronjobRoute(controllers), { prefix: '/cronjob' })
  await app.register(jobsRoute(controllers), { prefix: '/jobs' })
  await app.register(jobPodsRoute(controllers), { prefix: '/job-pods' })
  await app.register(podLogsRoute(controllers), { prefix: '/pod-logs' })
  await app.register(podProgressRoute(controllers, config), { prefix: '/pod-progress' })
  await app.register(triggerRoute(controllers), { prefix: '/trigger' })
}
