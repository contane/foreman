import { FunctionComponent, PropsWithChildren } from 'react'

export const Label: FunctionComponent<PropsWithChildren<{
  text: string
}>> = (props) => {
  return (
    <label className='block my-6 first:mt-0'>
      <div className='text-gray-200 mb-1'>{props.text}</div>
      {props.children}
    </label>
  )
}
