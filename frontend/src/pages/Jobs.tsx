import { FunctionComponent } from 'react'
import { useApiSubscription } from '../api/subscription.js'
import { api } from '../api/api.js'
import { Heading } from '../components/Heading.js'
import { JobPanel } from '../components/JobPanel.js'
import { ErrorMessage } from '../components/ErrorMessage.js'

export const Jobs: FunctionComponent = () => {
  const { loading, data: jobs, error } = useApiSubscription({ interval: 5_000 }, api.jobs)

  return (
    <div>
      <Heading>
        Job History
      </Heading>
      {error != null && (
        <ErrorMessage>
          Error loading jobs: {error.message}
        </ErrorMessage>
      )}
      {jobs != null && jobs.length === 0 && (
        <p>
          There are no previous jobs. Once a job is run, it will appear here automatically.
        </p>
      )}
      {jobs?.map((job) => (
        <JobPanel
          key={`${job.namespace}/${job.name}`}
          name={job.name}
          namespace={job.namespace}
          status={job.status}
          startTime={job.startTime}
          manual={job.manual}
        />
      ))}
      {loading && [...Array(8)].map((_, i) => (
        <JobPanel
          key={i}
          name={undefined}
          namespace={undefined}
          status={undefined}
          startTime={undefined}
          manual={false}
        />
      ))}
    </div>
  )
}
