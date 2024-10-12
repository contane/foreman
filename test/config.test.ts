import { createConfig, defaultConfig, readConfigDirectory } from '../src/config.js'
import assert from 'node:assert'

describe('config.ts', () => {
  describe('readConfigDirectory()', () => {
    it('returns the default config if the directory is missing', async () => {
      const config = await readConfigDirectory('missing-dir')
      assert.deepStrictEqual(config, defaultConfig)
    })
  })

  describe('createConfig()', () => {
    it('creates a valid config object', () => {
      assert.doesNotThrow(() => createConfig())
    })
  })
})
