import { createConfig } from '../src/config.js'
import assert from 'node:assert'

describe('config.ts', () => {
  describe('createConfig()', () => {
    it('creates a valid config object', () => {
      assert.doesNotThrow(() => createConfig())
    })
  })
})
