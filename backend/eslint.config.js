import eslintConfig from '@meyfa/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...eslintConfig,
  {
    ignores: ['dist']
  }
])
