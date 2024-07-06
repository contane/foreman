import { FunctionComponent } from 'react'
import { Switch } from '@headlessui/react'
import clsx from 'clsx'

export const ToggleSwitch: FunctionComponent<{
  value: boolean
  onChange: (value: boolean) => void
}> = (props) => {
  return (
    <Switch
      checked={props.value}
      onChange={props.onChange}
      className={clsx(
        'relative inline-flex h-6 w-11 items-center rounded-full',
        props.value ? 'bg-blue-600' : 'bg-gray-500'
      )}
    >
      <span
        className={clsx(
          'inline-block h-4 w-4 transform rounded-full bg-white transition',
          props.value ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </Switch>
  )
}
