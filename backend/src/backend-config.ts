interface LocalAuthOptions {
  username: string
  password: string
}

interface OidcAuthOptions {
  publicUrl: string
  issuer: string
  clientId: string
  clientSecret: string
}

export interface BackendConfig {
  cronJob: {
    namespace: string
    name: string
  }
  cookies: {
    key?: Buffer
    maxAge: number
  }
  auth: {
    local: ({ enabled: true } & LocalAuthOptions) | ({ enabled: false } & Partial<LocalAuthOptions>)
    oidc: ({ enabled: true } & OidcAuthOptions) | ({ enabled: false } & Partial<OidcAuthOptions>)
  }
  gitlab: {
    host?: string
  }
}
