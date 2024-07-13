import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApiSubscription } from '../api/subscription.js'
import { api } from '../api/api.js'
import { StatusDot } from '../components/StatusDot.js'
import { LogDialog } from '../components/LogDialog.js'
import { Heading } from '../components/Heading.js'
import { ColoredSkeleton } from '../components/ColoredSkeleton.js'
import type { JobPodsRoute, JobsItemRoute, PodProgressRoute } from 'backend/routes'
import { faClock, faDownload, faPaintRoller } from '@fortawesome/free-solid-svg-icons'
import Icon from '../components/Icon.js'
import { ErrorMessage } from '../components/ErrorMessage.js'
import { DateTime } from 'luxon'
import { Button } from '../components/Button.js'
import clsx from 'clsx'
import { Card } from '../components/Card.js'

export const Job: FunctionComponent = () => {
  const { namespace, name } = useParams()
  if (namespace == null || name == null) {
    // shouldn't happen - routes are configured to require these params
    throw new Error()
  }

  const { loading: jobLoading, data: job, error: jobError } = useApiSubscription({ interval: 5_000 }, api.job, { namespace, name })
  const { loading: podsLoading, data: pods, error: podsError } = useApiSubscription({ interval: 5_000 }, api.podsForJob, { namespace, name })

  // The name of the pod currently shown in the dialog
  const [dialogPodName, setDialogPodName] = useState<string | undefined>(undefined)

  const dialogPod = pods?.find((pod) => pod.name === dialogPodName)

  return (
    <>
      <Heading>
        {job != null ? <span>Job: {job.namespace}/{job.name}</span> : <ColoredSkeleton />}
      </Heading>
      {jobError != null && (<ErrorMessage>Error loading job: {jobError.message}</ErrorMessage>)}
      <div className='mb-4'>
        {jobLoading && <ColoredSkeleton />}
        {job != null && <JobStatus job={job} />}
      </div>
      {podsError != null && (<ErrorMessage>Error loading pods: {podsError.message}</ErrorMessage>)}
      <p className='mt-6 mb-4'>
        {podsLoading && <ColoredSkeleton />}
        {pods != null && (
          <span>{pods.length === 1 ? 'There is 1 associated pod' : `There are ${pods.length} associated pods`}:</span>
        )}
      </p>
      {podsLoading && <DummyPod />}
      {pods?.map((pod) => (
        <Pod key={pod.name} pod={pod} onViewLogs={() => setDialogPodName(pod.name)} />
      ))}
      {dialogPod != null && (
        <LogDialog
          podNamespace={dialogPod.namespace}
          podName={dialogPod.name}
          podActive={dialogPod.status !== 'success'}
          onClose={() => setDialogPodName(undefined)}
        />
      )}
    </>
  )
}

const JobStatus: FunctionComponent<{
  job: JobsItemRoute['Reply']
}> = (props) => {
  const navigate = useNavigate()

  const retry = useCallback(() => {
    if (props.job == null) {
      return undefined
    }
    const params = new URLSearchParams()
    if (props.job.settings.repositoryScope != null) {
      params.set('repositoryScope', props.job.settings.repositoryScope)
    }
    if (props.job.settings.debugLogging != null) {
      params.set('debugLogging', props.job.settings.debugLogging.toString())
    }
    navigate(`/trigger?${params.toString()}`)
  }, [props.job, navigate])

  const common = (
    <>
      {props.job.startTime != null && (
        <p>
          Started: {DateTime.fromISO(props.job.startTime).toLocaleString(DateTime.DATETIME_MED)}&nbsp;
          ({DateTime.fromISO(props.job.startTime).toRelative()})
        </p>
      )}
      {props.job.completionTime != null && (
        <p>
          Completed: {DateTime.fromISO(props.job.completionTime).toLocaleString(DateTime.DATETIME_MED)}&nbsp;
          ({DateTime.fromISO(props.job.completionTime).toRelative()})
        </p>
      )}
      {props.job.settings.repositoryScope != null && (
        <p>
          Repository scope: {props.job.settings.repositoryScope}
        </p>
      )}
      {props.job.settings.debugLogging != null && (
        <p>
          Debug logging: {props.job.settings.debugLogging ? 'enabled' : 'disabled'}
        </p>
      )}
      <div className='mt-2'>
        <Button onClick={retry} title='Create a new run with identical settings.'>
          Retry
        </Button>
      </div>
    </>
  )

  if (!props.job.manual) {
    return (
      <Card className='flex flex-col gap-1'>
        <p className='mb-2 font-semibold'>
          <Icon icon={faClock} className='mr-2' />
          This job was scheduled to run automatically.
        </p>
        {common}
      </Card>
    )
  }

  return (
    <Card className='flex flex-col gap-1'>
      <p className='text-orange-300 mb-2 font-semibold'>
        <Icon icon={faPaintRoller} className='mr-2' />
        {props.job.triggeredBy == null && 'This job was triggered manually by an unknown user.'}
        {props.job.triggeredBy != null && `This job was triggered manually by ${props.job.triggeredBy.username} (${props.job.triggeredBy.strategy} login).`}
      </p>
      {common}
    </Card>
  )
}

const Pod: FunctionComponent<{
  pod: JobPodsRoute['Reply'][number]
  onViewLogs: () => void
}> = (props) => {
  const { pod } = props

  const { loading, data: progress } = useApiSubscription({
    // Poll more frequently while the pod is running. Once it's done, there should be no more changes.
    interval: pod.status === 'success' ? (60 * 60 * 1000) : 5_000
  }, api.podProgress, {
    namespace: pod.namespace,
    name: pod.name
  })

  // A value between 0 and 1 representing the progress of repositories
  const progressValue = useMemo(() => {
    if (progress == null) {
      return 0
    }
    if (progress.length === 0) {
      return 1
    }
    let value = 0
    for (const item of progress ?? []) {
      switch (item.state) {
        case 'started':
          value += 1
          break
        case 'finished':
          value += 2
          break
      }
    }
    return value / (progress.length * 2)
  }, [progress])

  return (
    <Card>
      {/* name and actions */}
      <div className='flex flex-row items-center justify-between'>
        <div className='flex items-center'>
          <StatusDot status={pod.status} />
          <span className='ml-2'>{pod.namespace}/{pod.name}</span>
        </div>
        <div className='flex flex-row'>
          <button
            type='button'
            className='py-2 px-4 mr-2 rounded border-2 border-transparent bg-[#43454a] hocus:border-white/25 cursor-pointer'
            onClick={() => props.onViewLogs()}
          >
            View logs
          </button>
          <a
            href={'/api/pod-logs/' + pod.namespace + '/' + pod.name}
            download={pod.name + '-log.ndjson'}
            title='Download logs'
            className='py-2 px-4 rounded border-2 border-transparent bg-[#43454a] hocus:border-white/25 cursor-pointer flex items-center'
          >
            <Icon icon={faDownload} />
          </a>
        </div>
      </div>
      {/* progress summary */}
      {!loading && progress != null
        ? (
          <>
            <div className='mt-4 w-full rounded overflow-clip bg-gray-600'>
              <div
                className='h-2 bg-green-700 rounded transition-all duration-500 shadow-md shadow-black'
                style={{ width: `${progressValue * 100}%` }}
              />
            </div>
            <div className='mt-4'>
              {progress.length === 0 && (
                <p className='py-1'>No repositories were processed.</p>
              )}
              {progress.map((item) => (
                <ProgressItem key={item.repository} item={item} />
              ))}
            </div>
          </>
          )
        : <div className='mt-4 text-gray-400'>
          <ColoredSkeleton className='mr-4 px-2' />
        </div>
      }
    </Card>
  )
}

const DummyPod: FunctionComponent = () => {
  return (
    <Card>
      {/* name and actions */}
      <div className='flex flex-row items-center justify-between'>
        <div className='flex items-center'>
          <StatusDot status={undefined} />
          <ColoredSkeleton className='ml-2' width='16vw' />
        </div>
        <div className='flex flex-row'>
          <button
            type='button'
            className='py-2 px-4 mr-2 flex-1 rounded border-2 border-transparent bg-[#43454a] hocus:border-white/25 cursor-pointer'
            disabled
          >
            <ColoredSkeleton width='4rem' />
          </button>
          <p className='py-2 px-4 flex-1 rounded border-2 border-transparent bg-[#43454a] hocus:border-white/25 cursor-pointer flex items-center'>
            <ColoredSkeleton width='1rem' />
          </p>
        </div>
      </div>
      {/* progress summary */}
      <div className='mt-4 pt-4 border-t-2 border-white/25'>
        <ColoredSkeleton className='mr-4 px-2' />
      </div>
    </Card>
  )
}

const ProgressItem: FunctionComponent<{
  item: PodProgressRoute['Reply'][number] | undefined
}> = ({ item }) => {
  if (item == null) {
    return (
      <ColoredSkeleton className='mr-4 px-2' />
    )
  }

  return (
    <div className='py-1'>
      <span className={clsx(
        'inline-block mr-4 px-1 rounded-sm min-w-[4.5rem] text-center select-none capitalize',
        item.state === 'pending' && 'bg-gray-600',
        item.state === 'started' && 'bg-blue-700',
        item.state === 'finished' && 'bg-green-700'
      )}
      >
        {item.state}
      </span>
      {item.repositoryUrl != null
        ? (
          <a href={item.repositoryUrl} rel='noreferrer' className='hocus:underline'>
            {item.repository}
          </a>
          )
        : item.repository
      }
    </div>
  )
}
