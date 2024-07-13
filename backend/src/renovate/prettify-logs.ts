import pinoPretty from 'pino-pretty'
import { Writable } from 'node:stream'

export async function prettifyLogs (logs: string): Promise<string> {
  // TODO: This consumes a lot of memory. We should use streaming instead.
  // TODO: There should be a way for clients to request logs over WebSocket instead of polling.
  const chunks: string[] = []
  const prettyLogs = pinoPretty({
    translateTime: true,
    ignore: 'v,name,pid,hostname,logContext',
    colorize: false,
    destination: new Writable({
      write (chunk, enc, cb) {
        chunks.push(chunk.toString())
        cb()
      }
    })
  })
  // Process the string in chunks to avoid blocking the event loop.
  for (const chunk of chunked(logs)) {
    await new Promise<void>((resolve) => {
      if (!prettyLogs.write(chunk, 'utf8')) {
        prettyLogs.once('drain', resolve)
      } else {
        setImmediate(resolve)
      }
    })
  }
  await new Promise<void>((resolve) => prettyLogs.end(resolve))
  return chunks.join('')
}

function * chunked (str: string, size = 4096): Iterable<string> {
  for (let i = 0; i < str.length; i += size) {
    yield str.slice(i, i + size)
  }
}
