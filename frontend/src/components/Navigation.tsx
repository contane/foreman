import { FunctionComponent, PropsWithChildren } from 'react'
import { useApiSubscription } from '../api/subscription.js'
import { api } from '../api/api.js'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { StatusDot } from './StatusDot.js'
import { DateTime } from 'luxon'
import { ColoredSkeleton } from './ColoredSkeleton.js'
import { faPaintRoller } from '@fortawesome/free-solid-svg-icons'
import { Annotation } from './Annotation.js'
import { useMobileNavigation } from '../util/navigation.js'

const JOB_HISTORY_LIMIT = 3

export const Navigation: FunctionComponent<{
  onNavigate?: () => void
}> = (props) => {
  const isMobileNavigation = useMobileNavigation()

  return (
    <nav>
      <NavigationItem to='/' onNavigate={props.onNavigate}>
        Overview
      </NavigationItem>
      <NavigationItem to='/trigger' onNavigate={props.onNavigate}>
        Custom run
      </NavigationItem>
      {!isMobileNavigation && <NavigationJobsSection onNavigate={props.onNavigate} />}
    </nav>
  )
}

const NavigationJobsSection: FunctionComponent<{
  onNavigate?: () => void
}> = (props) => {
  const { loading, data: jobs } = useApiSubscription({ interval: 5_000 }, api.jobs)

  return (
    <>
      <div className='my-4'>
        Past/Active jobs:
      </div>

      {!loading
        ? jobs?.slice(0, JOB_HISTORY_LIMIT).map((job) => (
          <JobNavigationItem key={`${job.namespace}/${job.name}`} name={job.name} namespace={job.namespace} status={job.status} startTime={job.startTime} manual={job.manual} onNavigate={props.onNavigate} />
        ))
        : [...Array(JOB_HISTORY_LIMIT)].map((_, i) => (
          <JobNavigationItem key={i} name={undefined} namespace={undefined} status={undefined} startTime={undefined} manual={false} />
          ))
      }
      {!loading
        ? (
          <NavigationItem to='/jobs' onNavigate={props.onNavigate}>
            View all jobs {jobs != null ? `(${jobs.length})` : ''}
          </NavigationItem>
          )
        : (
          <div className='block mb-2 px-4 py-2 border-2 border-transparent rounded bg-[#43454a] hocus:border-[#fff4]'>
            <ColoredSkeleton />
          </div>
          )}
    </>
  )
}

const NavigationItem: FunctionComponent<PropsWithChildren<{
  to: string
  onNavigate?: () => void
}>> = (props) => {
  return (
    <NavLink
      to={props.to}
      end
      className={({ isActive }) => clsx(
        'block mb-2 px-4 py-2 border-2 border-transparent rounded',
        isActive ? 'bg-[#63656a]' : 'bg-[#43454a] hocus:border-[#fff4]'
      )}
      onClick={() => props.onNavigate?.()}
    >
      {props.children}
    </NavLink>
  )
}

const JobNavigationItem: FunctionComponent<{
  namespace: string | undefined
  name: string | undefined
  manual: boolean
  status: 'success' | 'failure' | 'active' | undefined
  startTime: string | undefined
  onNavigate?: () => void
}> = (props) => {
  if (props.namespace == null || props.name == null) {
    return (
      <div className='block mb-2 px-4 py-2 border-2 border-transparent rounded bg-[#43454a] hocus:border-[#fff4]'>
        <div className='flex items-center'>
          <StatusDot status={props.status} />
          <div className='ml-2 flex-1'>
            <ColoredSkeleton />
          </div>
        </div>
        <ColoredSkeleton />
      </div>
    )
  }

  return (
    <NavigationItem
      to={`/jobs/${props.namespace}/${props.name}`}
      onNavigate={props.onNavigate}
    >
      <div className='flex items-center'>
        <StatusDot status={props.status} />
        <span className='ml-2'>{props.namespace}/{props.name}</span>
      </div>
      <div className='text-gray-200 text-sm'>
        {props.startTime != null ? DateTime.fromISO(props.startTime).toRelative() : <ColoredSkeleton />}
        {props.manual && (
          <Annotation icon={faPaintRoller} text='Manual' />
        )}
      </div>
    </NavigationItem>
  )
}
