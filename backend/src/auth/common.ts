import { RouteHandlerMethod } from 'fastify'
import fastifyPassport from '@fastify/passport'

export enum AuthStrategy {
  LOCAL = 'local',
  OIDC = 'oidc'
}

// handled by @fastify/secure-session
export const authenticateSession = (): RouteHandlerMethod => fastifyPassport.authenticate('session')

export interface User {
  /**
   * The strategy used for login.
   */
  strategy: AuthStrategy

  /**
   * The username used for login.
   */
  username: string

  /**
   * The time when the session was created (in milliseconds since the Unix epoch).
   */
  createdAt: number
}

declare module 'fastify' {
  interface PassportUser extends User {}
}
