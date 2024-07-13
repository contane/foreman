import assert from 'node:assert'
import { extractProgress } from '../../src/renovate/progress.js'

describe('renovate/progress.ts', () => {
  describe('extractProgress()', () => {
    it('returns undefined for empty input', async () => {
      const result = extractProgress('', {})
      assert.strictEqual(result, undefined)
    })

    it('ignores non-JSON input', async () => {
      const result = extractProgress('foo bar\nbaz qux 42 {}', {})
      assert.strictEqual(result, undefined)
    })

    it('detects repository list', async () => {
      const log = [
        '{"name":"renovate","hostname":"renovate-foo-bar","pid":10,"level":30,"logContext":"abcd","msg":"test message","time":"2024-07-12T17:00:06.051Z","v":0}',
        '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","length":3,"repositories":["foo/bar", "foo/baz/qux", "random"],"msg":"Autodiscovered repositories","time":"2024-07-12T17:00:08.848Z","v":0}'
      ].join('\n')
      const result = extractProgress(log, {})
      assert.deepStrictEqual(result, [
        {
          repository: 'foo/bar',
          state: 'pending'
        },
        {
          repository: 'foo/baz/qux',
          state: 'pending'
        },
        {
          repository: 'random',
          state: 'pending'
        }
      ])
    })

    it('detects repository started/finished', async () => {
      const log = [
        '{"name":"renovate","hostname":"renovate-foo-bar","pid":10,"level":30,"logContext":"abcd","msg":"test message","time":"2024-07-12T17:00:06.051Z","v":0}',
        '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","length":3,"repositories":["foo/bar", "foo/baz/qux", "random"],"msg":"Autodiscovered repositories","time":"2024-07-12T17:00:08.848Z","v":0}',
        '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","repository":"foo/bar","renovateVersion":"12.345.6","msg":"Repository started","time":"2024-07-12T17:00:20.861Z","v":0}',
        '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","repository":"foo/bar","cloned":true,"durationMs":7133,"msg":"Repository finished","time":"2024-07-12T17:00:30.123Z","v":0}',
        '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","repository":"foo/baz/qux","renovateVersion":"12.345.6","msg":"Repository started","time":"2024-07-12T17:00:32.456Z","v":0}'
      ].join('\n')
      const result = extractProgress(log, {})
      assert.deepStrictEqual(result, [
        {
          repository: 'foo/bar',
          state: 'finished'
        },
        {
          repository: 'foo/baz/qux',
          state: 'started'
        },
        {
          repository: 'random',
          state: 'pending'
        }
      ])
    })
  })

  it('ignores invalid log lines', async () => {
    const log = [
      '{"name":"renovate","hostname":"renovate-foo-bar","pid":10,"level":30,"logContext":"abcd","msg":"test message","time":"2024-07-12T17:00:06.051Z","v":0}',
      'null',
      '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","length":3,"repositories":["foo/bar", "foo/baz/qux", "random"],"msg":"Autodiscovered repositories","time":"2024-07-12T17:00:08.848Z","v":0}',
      'false',
      'true',
      '{}',
      '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","repository":"foo/bar","renovateVersion":"12.345.6","msg":"Repository started","time":"2024-07-12T17:00:20.861Z","v":0}',
      '[{"msg:"something"}]',
      'some random text',
      '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","repository":"foo/bar","cloned":true,"durationMs":7133,"msg":"Repository finished","time":"2024-07-12T17:00:30.123Z","v":0}',
      '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","repository":"foo/baz/qux","renovateVersion":"12.345.6","msg":"Repository started","time":"2024-07-12T17:00:32.456Z","v":0}'
    ].join('\n')
    const result = extractProgress(log, {})
    assert.deepStrictEqual(result, [
      {
        repository: 'foo/bar',
        state: 'finished'
      },
      {
        repository: 'foo/baz/qux',
        state: 'started'
      },
      {
        repository: 'random',
        state: 'pending'
      }
    ])
  })

  it('sets repository URL if host is provided', async () => {
    const log = [
      '{"name":"renovate","hostname":"renovate-foo-bar","pid":10,"level":30,"logContext":"abcd","msg":"test message","time":"2024-07-12T17:00:06.051Z","v":0}',
      '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","length":3,"repositories":["foo/bar", "foo/baz/qux", "random"],"msg":"Autodiscovered repositories","time":"2024-07-12T17:00:08.848Z","v":0}',
      '{"name":"renovate","hostname":"renovate-1337","pid":10,"level":30,"logContext":"abcd","repository":"foo/bar","renovateVersion":"12.345.6","msg":"Repository started","time":"2024-07-12T17:00:20.861Z","v":0}'
    ].join('\n')
    const result = extractProgress(log, {
      repositoryBaseUrl: 'https://gitlab.example.com'
    })
    assert.deepStrictEqual(result, [
      {
        repository: 'foo/bar',
        state: 'started',
        repositoryUrl: 'https://gitlab.example.com/foo/bar'
      },
      {
        repository: 'foo/baz/qux',
        state: 'pending',
        repositoryUrl: 'https://gitlab.example.com/foo/baz/qux'
      },
      {
        repository: 'random',
        state: 'pending',
        repositoryUrl: 'https://gitlab.example.com/random'
      }
    ])
  })
})
