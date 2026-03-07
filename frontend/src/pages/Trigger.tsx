import { FunctionComponent, useCallback, useEffect, useState, type SubmitEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, TriggerJobOptions } from '../api/api.js'
import { useApiDispatch } from '../api/dispatch.js'
import { Button } from '../components/Button.js'
import { Card } from '../components/Card.js'
import { Heading } from '../components/Heading.js'
import { InputInfo } from '../components/InputInfo.js'
import { Label } from '../components/Label.js'
import { TextInput } from '../components/TextInput.js'
import { ToggleSwitch } from '../components/ToggleSwitch.js'

export const Trigger: FunctionComponent = () => {
  const navigate = useNavigate()

  const [repositoryScope, setRepositoryScope] = useState<string>('')
  const [debugLogging, setDebugLogging] = useState<boolean>(false)

  const [searchParams] = useSearchParams()
  const initialRepositoryScope = searchParams.get('repositoryScope') ?? ''
  const initialDebugLogging = searchParams.get('debugLogging') === 'true'
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRepositoryScope(initialRepositoryScope)
    setDebugLogging(initialDebugLogging)
  }, [initialRepositoryScope, initialDebugLogging])

  // repositoryScope may not: start or end with a slash, contain two consecutive slashes, or contain invalid characters
  const isValid = repositoryScope === '' || /^[a-z0-9-]+(\/[a-z0-9-]+)*$/i.test(repositoryScope)

  const { dispatch: dispatchTriggerJob, data: jobData, inProgress } = useApiDispatch(api.triggerJob)

  const onTrigger = useCallback((event: SubmitEvent): void => {
    event.preventDefault()
    const options: TriggerJobOptions = {
      debugLogging
    }
    if (repositoryScope !== '') {
      options.repositoryScope = repositoryScope
    }
    dispatchTriggerJob(options)
  }, [dispatchTriggerJob, repositoryScope, debugLogging])

  // redirect to job page when jobData is available
  useEffect(() => {
    if (jobData != null) {
      void navigate(`/jobs/${encodeURIComponent(jobData.namespace)}/${encodeURIComponent(jobData.name)}`)
    }
  }, [jobData, navigate])

  return (
    <>
      <Heading>
        Custom run
      </Heading>
      <Card className='max-w-[32rem]'>
        <form onSubmit={onTrigger}>
          <Label text='Custom repository scope'>
            <TextInput value={repositoryScope} onChange={(value) => setRepositoryScope(value)} />
            <InputInfo>
              If empty, the job will run on all configured repositories.
              Optionally, you can specify a repository scope in the format <code>owner/name</code>.
            </InputInfo>
          </Label>
          <Label text='Debug logging'>
            <ToggleSwitch value={debugLogging} onChange={(value) => setDebugLogging(value)} />
            <InputInfo>
              Note: This option may cause very large logs that may be slow to load.
              Choose a specific repository scope, if possible.
            </InputInfo>
          </Label>
          <Button type='submit' disabled={!isValid || inProgress}>
            Run job
          </Button>
        </form>
      </Card>
    </>
  )
}
