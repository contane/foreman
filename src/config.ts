import {
  coerce,
  defaulted,
  enums,
  Infer,
  instance,
  integer,
  literal,
  nonempty,
  object,
  optional,
  refine,
  string,
  type,
  union
} from 'superstruct'
import fs from 'node:fs'
import path from 'node:path'
import deepmerge from 'deepmerge'
import assert from 'node:assert'
import ms from 'ms'
import YAML from 'yaml'

const httpUrlString = refine(nonempty(string()), 'url', (value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch (e) {
    return false
  }
})

export const timeStringToMs = refine(
  coerce(integer(), string(), (value) => ms(value)),
  'positive integer',
  (value) => Number.isSafeInteger(value) && value > 0
)

const configSchema = object({
  kubeConfig: object({
    source: enums(['in-cluster', 'file']),
    context: optional(nonempty(string()))
  }),
  cronJob: object({
    namespace: nonempty(string()),
    name: nonempty(string())
  }),
  cookies: object({
    // cookies.key is either undefined or a base64-encoded string, which is decoded to a Buffer
    key: optional(coerce(instance(Buffer), nonempty(string()), (value) => Buffer.from(value, 'base64'))),
    maxAge: timeStringToMs
  }),
  auth: object({
    // auth.local is either disabled or enabled with username and password
    local: union([
      type({ enabled: literal(false) }),
      object({
        enabled: literal(true),
        username: defaulted(nonempty(string()), 'admin'),
        password: nonempty(string())
      })
    ]),
    // auth.oidc is either disabled or enabled with issuer, clientId and clientSecret
    oidc: union([
      type({ enabled: literal(false) }),
      object({
        enabled: literal(true),
        issuer: httpUrlString,
        clientId: nonempty(string()),
        clientSecret: nonempty(string()),
        publicUrl: httpUrlString
      })
    ])
  }),
  gitlab: object({
    host: optional(httpUrlString)
  })
})

export type Config = Infer<typeof configSchema>

export const defaultConfig: Config = Object.freeze({
  kubeConfig: Object.freeze({
    source: 'in-cluster',
    context: undefined
  }),
  cronJob: Object.freeze({
    namespace: 'renovate',
    name: 'renovate'
  }),
  cookies: Object.freeze({
    key: undefined,
    maxAge: ms('24h')
  }),
  auth: Object.freeze({
    local: Object.freeze({
      enabled: false
    }),
    oidc: Object.freeze({
      enabled: false
    })
  }),
  gitlab: Object.freeze({})
})

export async function readConfigDirectory (directory: string): Promise<Config> {
  const entries = await fs.promises.readdir(directory, { withFileTypes: true })
  const configFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'))

  // sort by name, so that 01-foo.yaml is read before 02-bar.yaml
  configFiles.sort((a, b) => a.name.localeCompare(b.name, 'en-US'))

  if (configFiles.length === 0) {
    // ignore missing custom config, simply use default values
    return defaultConfig
  }

  const contents = await Promise.all(configFiles.map(async (configFile) => {
    const stringContent = await fs.promises.readFile(path.join(directory, configFile.name), 'utf8')
    return YAML.parse(stringContent)
  }))

  return createConfig(...contents)
}

export function createConfig (...configFiles: unknown[]): Config {
  const values = configFiles.map((configFile) => {
    assert.ok(configFile != null && typeof configFile === 'object' && !Array.isArray(configFile), 'config must be an object')
    return configFile
  })

  const merged = deepmerge.all([defaultConfig, ...values], {
    // arrays are overwritten completely, instead of joined
    arrayMerge: (dst: any[], src: any[]) => src,
    isMergeableObject: (value) => typeof value === 'object' && value != null && !Buffer.isBuffer(value)
  })

  return configSchema.create(merged)
}
