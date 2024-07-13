import { FunctionComponent, useLayoutEffect, useRef, useState } from 'react'
import { useApiSubscription } from '../api/subscription.js'
import { api } from '../api/api.js'
import { ToggleSwitch } from './ToggleSwitch.js'
import Icon from './Icon.js'
import { faCircleNotch, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useLocalStorage } from '@uidotdev/usehooks'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

const PRETTY_KEY = 'foreman.logdialog.pretty'

export const LogDialog: FunctionComponent<{
  podNamespace: string
  podName: string
  podActive: boolean
  onClose: () => void
}> = (props) => {
  const [pretty, setPretty] = useLocalStorage<boolean>(PRETTY_KEY, true)
  const [follow, setFollow] = useState<boolean>(true)

  return (
    <Dialog open onClose={props.onClose} className='relative z-50'>
      <div className='fixed inset-0 flex w-screen items-center justify-center p-4 bg-black/50'>
        <DialogPanel className='relative w-[max(90vw,20rem)] h-[max(90vh,12rem)] flex flex-col bg-[#2b2d30] p-2 rounded'>
          <button
            type='button'
            className='absolute top-2 right-2 text-white text-2xl py-0 px-2 leading-none hover:text-gray-300 focus:text-gray-300'
            onClick={props.onClose}
          >
            <Icon icon={faXmark} size='xs' />
          </button>

          <DialogTitle>
            Logs for pod: {`${props.podNamespace}/${props.podName}`}
          </DialogTitle>

          <div className='my-2 flex items-center select-none gap-4'>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className='whitespace-nowrap'>
              <ToggleSwitch value={pretty} onChange={setPretty} />
              <span className='ml-2'>Pretty</span>
            </label>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className='whitespace-nowrap'>
              <ToggleSwitch value={follow} onChange={setFollow} />
              <span className='ml-2'>Follow</span>
            </label>
          </div>

          <LogDisplay
            podNamespace={props.podNamespace}
            podName={props.podName}
            podActive={props.podActive}
            pretty={pretty}
            follow={follow}
            onChangeFollow={(value) => setFollow(value)}
          />
        </DialogPanel>
      </div>
    </Dialog>
  )
}

const LogDisplay: FunctionComponent<{
  podNamespace: string
  podName: string
  podActive: boolean
  pretty: boolean
  follow: boolean
  onChangeFollow?: (follow: boolean) => void
}> = (props) => {
  const { data: logs } = useApiSubscription({
    // Poll more frequently while the pod is running. Once it's done, there should be no further log output.
    interval: props.podActive ? 5_000 : (60 * 60 * 1000)
  }, api.podLogs, {
    namespace: props.podNamespace,
    name: props.podName
  }, {
    pretty: props.pretty
  })

  const logElement = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (props.follow) {
      logElement.current?.scrollTo({
        top: logElement.current?.scrollHeight
      })
    }
  }, [props.follow, logs])

  if (logs == null) {
    return (
      <div className='h-full font-mono text-white bg-[#111] p-4 overflow-y-scroll overflow-x-auto whitespace-pre flex justify-center items-center'>
        <div role='status'>
          <Icon icon={faCircleNotch} className='inline w-8 h-8 mr-2 animate-spin' />
          <span className='sr-only'>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={logElement}
      className='h-full font-mono text-white bg-[#111] p-4 overflow-y-scroll overflow-x-auto whitespace-pre'
      onScroll={(event) => {
        if (props.onChangeFollow != null && event.target instanceof HTMLDivElement) {
          const { scrollTop, scrollHeight, clientHeight } = event.target
          if (scrollTop + clientHeight >= scrollHeight - 10) {
            props.onChangeFollow(true)
          } else {
            props.onChangeFollow(false)
          }
        }
      }}
    >
      {logs}
    </div>
  )
}
