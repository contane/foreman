import { FunctionComponent, PropsWithChildren } from 'react'

export const InputInfo: FunctionComponent<PropsWithChildren> = (props) => {
  return (
    <div className='text-gray-400 text-sm mt-1'>
      {props.children}
    </div>
  )
}
