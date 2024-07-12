import { FormEvent, FunctionComponent, PropsWithChildren, useCallback, useEffect, useState } from 'react'
import { Label } from '../components/Label.js'
import { TextInput } from '../components/TextInput.js'
import { Button } from '../components/Button.js'
import { useApiDispatch } from '../api/dispatch.js'
import { api } from '../api/api.js'
import { Heading } from '../components/Heading.js'
import { useSearchParams } from 'react-router-dom'
import { useApiSubscription } from '../api/subscription.js'
import { ErrorMessage } from '../components/ErrorMessage.js'
import { Card } from '../components/Card.js'

export const Login: FunctionComponent = () => {
  const [searchParams] = useSearchParams()
  const error = searchParams.get('login_error') ?? undefined

  const authStrategies = useApiSubscription({ interval: 60_000 }, api.authStrategies)

  return (
    <>
      <Heading>
        Login
      </Heading>
      {authStrategies.data != null && (
        <div className='max-w-[32rem]'>
          {authStrategies.data.length === 0 && (
            <Card>
              No login methods are available.
            </Card>
          )}
          {authStrategies.data.includes('oidc') && <OidcLogin hasError={error === 'oidc'} />}
          {authStrategies.data.includes('local') && <LocalLogin hasError={error === 'local'} />}
        </div>
      )}
    </>
  )
}

const LoginOption: FunctionComponent<PropsWithChildren<{
  title: string
}>> = (props) => {
  return (
    <Card>
      <p className='text-lg mb-4'>
        {props.title}
      </p>
      {props.children}
    </Card>
  )
}

const OidcLogin: FunctionComponent<{
  hasError?: boolean
}> = (props) => {
  return (
    <LoginOption title='Identity Provider Login'>
      <div>
        {props.hasError === true && <LoginFailureMessage />}
        <Button as='a' href='/api/auth/oidc'>
          Login
        </Button>
      </div>
    </LoginOption>
  )
}

const LocalLogin: FunctionComponent<{
  hasError?: boolean
}> = (props) => {
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const { dispatch: dispatchLocalLogin, data: localLoginResult, error: loginError, inProgress } = useApiDispatch(api.localLogin)

  const onSubmit = useCallback((event: FormEvent): void => {
    event.preventDefault()
    dispatchLocalLogin({
      username: username.trim(),
      password
    })
  }, [dispatchLocalLogin, username, password])

  // reload page when login is successful
  useEffect(() => {
    if (localLoginResult != null) {
      window.location.reload()
    }
  }, [localLoginResult])

  const isValid = username.trim() !== '' && password !== ''

  return (
    <LoginOption title='Local Login'>
      <form onSubmit={onSubmit}>
        {(loginError != null || props.hasError === true) && <LoginFailureMessage />}
        <Label text='Username'>
          <TextInput value={username} onChange={(value) => setUsername(value)} />
        </Label>
        <Label text='Password'>
          <TextInput value={password} onChange={(value) => setPassword(value)} type='password' />
        </Label>
        <Button type='submit' disabled={!isValid || inProgress}>
          Login
        </Button>
      </form>
    </LoginOption>
  )
}

const LoginFailureMessage: FunctionComponent = () => {
  return (
    <ErrorMessage>
      Login failed. Please try again.
    </ErrorMessage>
  )
}
