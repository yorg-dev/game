import { format } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import { Create } from '@/components/admin'
import { useTranslate } from 'ra-core'

import Form from './Form'

const ConnectionCreate = () => {
  const redirect: string = 'list'
  const [params] = useSearchParams()
  const translate = useTranslate()

  const defaultValues = {
    app_id: params.get('app_id'),
    active: true,
    start_at: format(new Date(), 'yyyy-MM-dd'),
  }

  return (
    <Create redirect={redirect} title={translate('connections.actions.create')} actions={false}>
      <Form defaultValues={defaultValues} mode="create" />
    </Create>
  )
}

export default ConnectionCreate
