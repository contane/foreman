import { FunctionComponent } from 'react'
import { DateTime } from 'luxon'
import { useApiSubscription } from '../api/subscription.js'
import { api } from '../api/api.js'
import { Heading } from '../components/Heading.js'
import { InfoCard } from '../components/InfoCard.js'
import cronstrue from 'cronstrue'
import { JobPanel } from '../components/JobPanel.js'
import { ColoredSkeleton } from '../components/ColoredSkeleton.js'
import { Link } from 'react-router-dom'
import { useMobileNavigation } from '../util/navigation.js'

const JOB_HISTORY_LIMIT = 3

function lowercaseFirstLetter (str: string): string {
  // https://github.com/bradymholt/cRonstrue/issues/40
  return str.charAt(0).toLowerCase() + str.slice(1)
}

export const Home: FunctionComponent = () => {
  const { loading, data: cronJob } = useApiSubscription({ interval: 60_000 }, api.cronJob)

  const isMobileNavigation = useMobileNavigation()

  return (
    <>
      <Heading>
        Overview
      </Heading>
      <dl className='my-1 grid grid-cols-1 md:grid-cols-2 gap-4'>
        <InfoCard title='Next run'>
          {!loading && cronJob != null
            ? (
              <>
                {DateTime.fromISO(cronJob.nextScheduleTime).toLocaleString(DateTime.DATETIME_MED)}&nbsp;
                ({DateTime.fromISO(cronJob.nextScheduleTime).toRelative()})
              </>
              )
            : null}
        </InfoCard>
        <InfoCard title='CronJob schedule'>
          {!loading && cronJob?.schedule != null
            ? `${cronJob.schedule} (${lowercaseFirstLetter(cronstrue.toString((cronJob.schedule)))})`
            : null}
        </InfoCard>
      </dl>
      {isMobileNavigation && <JobsSection />}
    </>
  )
}

const JobsSection: FunctionComponent = () => {
  const { data: jobs, loading } = useApiSubscription({ interval: 5_000 }, api.jobs)

  return (
    <>
      <Heading>
        Past/Active jobs
      </Heading>
      {!loading
        ? jobs?.slice(0, JOB_HISTORY_LIMIT).map((job) => (
          <JobPanel key={`${job.namespace}/${job.name}`} name={job.name} namespace={job.namespace} status={job.status} startTime={job.startTime} manual={job.manual} />
        ))
        : [...Array(JOB_HISTORY_LIMIT)].map((_, i) => (
          <JobPanel key={i} name={undefined} namespace={undefined} status={undefined} startTime={undefined} manual={false} />
          ))
      }
      {!loading
        ? (
          <Link to='/jobs' className='block mb-2 p-4 bg-[#2b2d30] border-2 border-[#43454a] rounded hocus:border-[#fff4]'>
            View all jobs ({jobs?.length})
          </Link>
          )
        : (
          <div className='block mb-2 px-4 py-2 border-2 border-transparent rounded bg-[#43454a] hocus:border-[#fff4]'>
            <ColoredSkeleton />
          </div>
          )}
    </>
  )
}
