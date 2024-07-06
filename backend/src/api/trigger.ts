import { FastifyPluginAsync } from 'fastify'
import { Controllers } from '../controllers.js'
import { boolean, Infer, object, optional, pattern, string } from 'superstruct'
import { badRequest, forbidden } from './errors.js'
import { authenticateSession } from '../auth/common.js'
import assert from 'node:assert'
import { DEFAULT_NAMESPACE } from '../kubernetes/api.js'

const triggerSchema = object({
  repositoryScope: optional(pattern(string(), /^[a-z0-9-]+(\/[a-z0-9-]+)*$/i)),
  debugLogging: optional(boolean())
})

export interface TriggerRoute {
  Body: Infer<typeof triggerSchema>
  Reply: {
    namespace: string
    name: string
  }
}

export const triggerRoute = ({ triggerController }: Controllers): FastifyPluginAsync => async (app) => {
  app.addHook('preValidation', authenticateSession())

  app.post<TriggerRoute>('/', async (request, reply) => {
    if (request.user == null) {
      return await forbidden(reply)
    }
    const [err, body] = triggerSchema.validate(request.body, { coerce: true })
    if (err != null) {
      return await badRequest(reply)
    }
    const createdJob = await triggerController.trigger(body, {
      username: request.user.username,
      strategy: request.user.strategy
    })
    assert.ok(createdJob.metadata?.name != null)
    return {
      namespace: createdJob.metadata.namespace ?? DEFAULT_NAMESPACE,
      name: createdJob.metadata.name
    }
  })
}
