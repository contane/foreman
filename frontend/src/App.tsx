import { FunctionComponent, useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home.js'
import { Navigation } from './components/Navigation.js'
import { Job } from './pages/Job.js'
import { Trigger } from './pages/Trigger.js'
import { Login } from './pages/Login.js'
import { useApiSubscription } from './api/subscription.js'
import { useApiDispatch } from './api/dispatch.js'
import { api } from './api/api.js'
import { Button } from './components/Button.js'
import { Jobs } from './pages/Jobs.js'
import clsx from 'clsx'
import Icon from './components/Icon.js'
import { faChevronDown, faChevronUp, faPaintRoller } from '@fortawesome/free-solid-svg-icons'
import { ColoredSkeleton } from './components/ColoredSkeleton.js'
import { useMobileNavigation } from './util/navigation.js'

export const App: FunctionComponent = () => {
  const { loading, data: userInfo } = useApiSubscription({ interval: 60_000 }, api.userInfo)

  const { dispatch: dispatchLogout, data: logoutResult, inProgress: logoutInProgress } = useApiDispatch(api.logout)

  // refresh the page when logging out
  useEffect(() => {
    if (logoutResult != null) {
      window.location.reload()
    }
  }, [logoutResult])

  const [asideExpanded, setAsideExpanded] = useState(false)

  // close the aside when the screen size is large enough to show it always, so it isn't unexpectedly open next time
  const isMobileNavigation = useMobileNavigation()
  useEffect(() => {
    if (!isMobileNavigation) {
      setAsideExpanded(false)
    }
  }, [isMobileNavigation])

  return (
    <BrowserRouter>
      <div className={clsx('flex min-h-screen', isMobileNavigation ? 'flex-col' : 'flex-row')}>
        <aside className={clsx(
          'relative flex-shrink-0 bg-[#2b2d30] p-4',
          isMobileNavigation ? 'w-full' : 'w-1/4 min-w-[20rem] max-w-[24rem]'
        )}
        >
          <Link to='/' className='text-2xl'>
            <Icon icon={faPaintRoller} className='mr-2' size='xs'></Icon>
            Foreman
          </Link>
          <button
            type='button'
            className={clsx(
              'absolute top-3 right-4 rounded border-2 border-white/25 hocus:border-white/50 p-2 leading-none',
              isMobileNavigation ? 'block' : 'hidden'
            )}
            onClick={() => setAsideExpanded(state => !state)}
          >
            <Icon icon={asideExpanded ? faChevronUp : faChevronDown} />
          </button>
          {!loading && userInfo !== false && (
            <div className={clsx('mt-4', isMobileNavigation && !asideExpanded ? 'hidden' : 'block')}>
              <Navigation onNavigate={() => setAsideExpanded(false)} />
              <div className='my-4'>
                {!loading ? <span>Logged in as: {userInfo?.username} ({userInfo?.strategy} login)</span> : <ColoredSkeleton />}
              </div>
              <Button onClick={dispatchLogout} disabled={loading || logoutInProgress}>
                Logout
              </Button>
            </div>
          )}
        </aside>
        <main className='flex-grow p-4'>
          <Routes>
            {!loading && userInfo === false && (
              <>
                <Route path='*' element={<Navigate to='/login' />} />
                <Route path='/login' element={<Login />} />
              </>
            )}
            {!loading && userInfo !== false && (
              <>
                <Route path='/login' element={<Navigate to='/' replace />} />
                <Route path='/' element={<Home />} />
                <Route path='/trigger' element={<Trigger />} />
                <Route path='/jobs' element={<Jobs />} />
                <Route path='/jobs/:namespace/:name' element={<Job />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
