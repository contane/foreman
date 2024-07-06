import { FastifyPluginAsync } from 'fastify'
import { Controllers } from '../controllers.js'
import cronParser from 'cron-parser'
import { forbidden, notFound } from './errors.js'
import { authenticateSession } from '../auth/common.js'

export interface CronJobRoute {
  Reply: {
    schedule?: string
    timeZone?: string
    suspend: boolean
    nextScheduleTime: string
  }
}

export const cronjobRoute = ({ cronJobController }: Controllers): FastifyPluginAsync => async (app) => {
  app.addHook('preValidation', authenticateSession())

  app.get<CronJobRoute>('/', async (request, reply) => {
    if (request.user == null) {
      return await forbidden(reply)
    }

    const cronJob = await cronJobController.getCronJob()
    if (cronJob == null) {
      return await notFound(reply)
    }

    const schedule = typeof cronJob.spec?.schedule === 'string' ? cronJob.spec.schedule : undefined
    const interval = cronParser.parseExpression(schedule ?? '', {
      tz: typeof cronJob.spec?.timeZone === 'string' ? cronJob.spec.timeZone : undefined
    })

    return {
      schedule,
      timeZone: cronJob.spec?.timeZone,
      suspend: cronJob.spec?.suspend ?? false,
      nextScheduleTime: interval.next().toISOString()
    }
  })
}
