import passport from '@fastify/passport'

// Something is wrong with esModuleInterop... this is a workaround
export const fastifyPassport = passport.default
