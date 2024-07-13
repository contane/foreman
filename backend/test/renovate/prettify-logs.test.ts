import assert from 'node:assert'
import { prettifyLogs } from '../../src/renovate/prettify-logs.js'

describe('renovate/prettify-logs.ts', () => {
  describe('prettifyLogs()', () => {
    const oldTimezone = process.env.TZ

    before(() => {
      process.env.TZ = 'UTC'
    })

    after(() => {
      process.env.TZ = oldTimezone
    })

    it('returns empty string for empty input', async () => {
      const result = await prettifyLogs('')
      assert.strictEqual(result, '')
    })

    it('returns the same string for non-JSON input', async () => {
      const result = await prettifyLogs('hello world\nError: {"key":"value"}\n')
      assert.strictEqual(result, 'hello world\nError: {"key":"value"}\n')
    })

    it('formats JSON logs', async () => {
      const log = [
        '{"name":"renovate","hostname":"renovate-foo-bar","pid":10,"level":30,"logContext":"abcd","msg":"test message","time":"2024-07-12T17:00:06.051Z","v":0}',
        '{"name":"renovate","hostname":"renovate-foo-bar","pid":10,"level":40,"logContext":"abcd","foo":{"bar":"baz"},"qux":42,"msg":"another message","time":"2024-07-12T17:00:25.512Z","v":0}'
      ].join('\n')
      const prettyLog = [
        '[17:00:06.051] INFO: test message',
        '[17:00:25.512] WARN: another message',
        '    foo: {',
        '      "bar": "baz"',
        '    }',
        '    qux: 42',
        ''
      ].join('\n')
      const result = await prettifyLogs(log)
      assert.strictEqual(result, prettyLog)
    })

    it('formats autodiscovery logs', async () => {
      const log = '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","length":4,"repositories":["foo/bar", "foo/baz/qux", "random", "stuff"],"msg":"Autodiscovered repositories","time":"2024-07-12T17:00:08.848Z","v":0}\n'
      const prettyLog = [
        '[17:00:08.848] INFO: Autodiscovered repositories',
        '    length: 4',
        '    repositories: [',
        '      "foo/bar",',
        '      "foo/baz/qux",',
        '      "random",',
        '      "stuff"',
        '    ]',
        ''
      ].join('\n')
      const result = await prettifyLogs(log)
      assert.strictEqual(result, prettyLog)
    })

    it('formats repository started', async () => {
      const log = '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","repository":"foo/bar/baz","renovateVersion":"12.345.6","msg":"Repository started","time":"2024-07-12T17:00:08.861Z","v":0}\n'
      const prettyLog = [
        '[17:00:08.861] INFO: Repository started',
        '    repository: "foo/bar/baz"',
        '    renovateVersion: "12.345.6"',
        ''
      ].join('\n')
      const result = await prettifyLogs(log)
      assert.strictEqual(result, prettyLog)
    })
  })
})
