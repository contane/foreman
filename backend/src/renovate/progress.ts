import sjson from 'secure-json-parse'

export interface ProgressItem {
  repository: string
  repositoryUrl?: string
  state: 'pending' | 'started' | 'finished'
}

export function extractProgress (logs: string, options: {
  repositoryBaseUrl?: string
}): ProgressItem[] | undefined {
  const repositories = new Map<string, ProgressItem>()
  let foundRepositories = false
  for (const line of lines(logs)) {
    // Avoid parsing log lines that are obviously irrelevant.
    // This improves performance even for small logs, but especially for debug/trace logs it can improve by 5-10x.
    if (!line.includes('"repositories"') && !line.includes('Repository started') && !line.includes('Repository finished')) {
      continue
    }
    const message = tryParseLogMessage(line)
    // Note: While it looks ugly, manual validation is more than 3x faster than using superstruct.
    //       This is worth it here as there is lots of data to process.
    if (message == null || typeof message !== 'object' || !('msg' in message)) {
      continue
    }
    // The initial log message is for autodiscovery and tells us about the repositories that will be processed.
    if ('repositories' in message && Array.isArray(message.repositories) &&
      message.repositories.every((item) => typeof item === 'string')) {
      foundRepositories = true
      for (const repository of message.repositories) {
        const item: ProgressItem = { repository, state: 'pending' }
        if (options.repositoryBaseUrl != null) {
          item.repositoryUrl = new URL(repository, options.repositoryBaseUrl).toString()
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
