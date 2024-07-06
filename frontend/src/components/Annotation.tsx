import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FunctionComponent, PropsWithChildren } from 'react'
import Icon from './Icon.js'

export const Annotation: FunctionComponent<PropsWithChildren<{
  icon: IconProp
  text: string
}>> = (props) => {
  return (
    <span className='text-white text-xs font-medium px-2.5 py-0.5 ml-2 rounded-full border border-white/50'>
      <Icon icon={props.icon} className='mr-1' size='sm' />
      {props.text}
    </span>
  )
}
