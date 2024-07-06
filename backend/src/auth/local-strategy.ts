import { Strategy as LocalStrategy } from 'passport-local'
import crypto, { BinaryLike, timingSafeEqual } from 'node:crypto'
import { Mutex } from '../util/mutex.js'
import { AuthStrategy, User } from './common.js'
import { RouteHandlerMethod } from 'fastify'
import fastifyPassport from '@fastify/passport'
import { promisify } from 'node:util'

export const authenticateLocal = (): RouteHandlerMethod => fastifyPassport.authenticate(AuthStrategy.LOCAL)

export interface LocalStrategyRequestBody {
  username: string
  password: string
}

export async function makeLocalStrategy (adminUser: {
  username: string
  password: string
}): Promise<LocalStrategy> {
  const options = {
    usernameField: 'username' satisfies keyof LocalStrategyRequestBody,
    passwordField: 'password' satisfies keyof LocalStrategyRequestBody
  }

  // If the admin user has no password, disable the local strategy.
  if (adminUser.password === '') {
    return new LocalStrategy(options, function (username, password, done) {
      done(null, false)
    })
  }

  // Otherwise, hash the password with scrypt.
  // We don't want to perform direct comparisons on login requests because that would speed up brute force attacks.
  const salt = crypto.randomBytes(16)
  const hash = await hashPassword(adminUser.password, salt)

  return new LocalStrategy(options, function (username, password, done) {
    if (username !== adminUser.username) {
      done(null, false)
      return
    }
    // Hash the password with the same salt and compare the hashes.
    hashPassword(password, salt).then((hash2) => {
      if (timingSafeEqual(hash, hash2)) {
        done(null, {
          strategy: AuthStrategy.LOCAL,
          username,
          createdAt: Date.now()
        } satisfies User)
        return
      }
      done(null, false)
    }).catch(done)
  })
}

const hashingMutex = new Mutex()

const promiseScrypt = promisify<BinaryLike, BinaryLike, number, Buffer>(crypto.scrypt)

async function hashPassword (password: string, salt: Buffer): Promise<Buffer> {
  // Since hashing is resource intensive, we perform it serially (one at a time).
  const unlock = await hashingMutex.lock()
  try {
    return await promiseScrypt(password, salt, 64)
  } finally {
    unlock()
  }
}
