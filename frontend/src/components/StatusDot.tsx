import { FunctionComponent } from 'react'
import Icon from './Icon.js'
import { faCircleCheck, faXmark } from '@fortawesome/free-solid-svg-icons'

export const StatusDot: FunctionComponent<{
  status: 'success' | 'failure' | 'active' | undefined
}> = ({ status }) => {
  if (status === 'active') {
    return (
      <span className='relative inline-block h-4 w-4'>
        <span className='absolute h-full w-full rounded-full bg-sky-400 opacity-75 animate-ping' />
        <span className='absolute h-full w-full rounded-full bg-blue-500' />
      </span>
    )
  }

  // Distinguish by shape and not just color to be accessible to colorblind users

  if (status === 'success') {
    return (
      <Icon icon={faCircleCheck} className='text-green-500 text-base' />
    )
  }

  if (status === 'failure') {
    return (
      <Icon icon={faXmark} className='text-red-500 text-base' />
    )
  }

  return (
    <span className='inline-block rounded-full h-4 w-4 bg-gray-500 animate-pulse' />
  )
}
