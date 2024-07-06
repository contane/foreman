import { FastifyPluginAsync } from 'fastify'
import { Controllers } from '../controllers.js'
import { forbidden, notFound } from './errors.js'
import { authenticateSession } from '../auth/common.js'
import sjson from 'secure-json-parse'
import { BackendConfig } from '../backend-config.js'

interface ProgressItem {
  repository: string
  repositoryUrl?: string
  state: 'pending' | 'started' | 'finished'
  duration?: number
}

export interface PodProgressRoute {
  Reply: ProgressItem[]
}

export const podProgressRoute = ({ logsController }: Controllers, config: BackendConfig): FastifyPluginAsync => async (app) => {
  app.addHook('preValidation', authenticateSession())

  app.get<PodProgressRoute & {
    Params: {
      namespace: string
      name: string
    }
  }>('/:namespace/:name', async (request, reply) => {
    if (request.user == null) {
      return await forbidden(reply)
    }
    const logs = await logsController.getPodLogs({ namespace: request.params.namespace, name: request.params.name })
    if (logs == null) {
      return await notFound(reply)
    }
    const progress = getProgress(logs, config)
    if (progress == null) {
      // In case the log cannot be parsed, progress is unavailable, so return a 404.
      return await notFound((reply))
    }
    return progress
  })
}

function getProgress (logs: string, config: BackendConfig): ProgressItem[] | undefined {
  const repositories = new Map<string, ProgressItem>()
  let foundRepositories = false
  for (const line of lines(logs)) {
    const message = tryParseLogMessage(line)
    // Note: While it looks ugly, manual validation is more than 3x faster than using superstruct.
    //       This is worth it here as there is lots of data to process.
    if (message == null || typeof message !== 'object' || !('msg' in message)) {
      continue
    }
    // The initial log message is for autodiscovery and tells us about the repositories that will be processed.
    if ('repositories' in message && Array.isArray(message.repositories) &&
      message.repositories.every(msg => typeof msg === 'string')) {
      foundRepositories = true
      for (const repository of message.repositories) {
        const item: ProgressItem = { repository, state: 'pending' }
        if (config.gitlab.host != null) {
          item.repositoryUrl = new URL(repository, config.gitlab.host).toString()
        }
        repositories.set(repository, item)
      }
    }
    // Log messages associated with a repository have a repository property, and update the item's status.
    if (!('repository' in message) || typeof message.repository !== 'string') {
      continue
    }
    const item = repositories.get(message.repository)
    if (item == null) {
      continue // what?
    }
    switch (message.msg) {
      case 'Repository started':
        item.state = 'started'
        break
      case 'Repository finished':
        item.state = 'finished'
        break
    }
  }
  if (!foundRepositories) {
    return undefined
  }
  // Note: JS Map always returns values in insertion order.
  return Array.from(repositories.values())
}

function * lines (str: string): Generator<string> {
  let lineFrom = 0
  while (lineFrom < str.length) {
    let lineTo = str.indexOf('\n', lineFrom)
    if (lineTo === -1) {
      lineTo = str.length
    }
    yield str.slice(lineFrom, lineTo)
    lineFrom = lineTo + 1
  }
}

function tryParseLogMessage (str: string): unknown {
  try {
    return sjson.parse(str)
  } catch {
    return undefined
  }
}
