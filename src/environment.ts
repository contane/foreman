// load the .env file
import 'dotenv/config'

function getEnvOrDefault (name: string, defaultValue: string): string {
  const value = process.env[name]
  return value == null || value === '' ? defaultValue : value
}

export function getPort (): number {
  const port = getEnvOrDefault('PORT', '8080')
  const portNumber = Number.parseInt(port, 10)
  if (!Number.isSafeInteger(portNumber) || portNumber < 0 || portNumber > 65535) {
    throw new Error(`Invalid PORT: "${port}"`)
  }
  return portNumber
}
