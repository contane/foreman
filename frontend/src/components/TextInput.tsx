import { FunctionComponent } from 'react'

export const TextInput: FunctionComponent<{
  type?: string
  value: string
  onChange: (value: string) => void
}> = (props) => {
  return (
    <input
      type={props.type ?? 'text'}
      className='border-b-2 border-gray-400 px-4 py-2 w-full bg-gray-600 outline-none hocus:border-gray-50'
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    />
  )
}
