import { Admin } from '@/components/admin'
import { Resource } from 'ra-core'
import { dataProvider } from './providers/dataProvider'
import authProvider from './providers/authProvider'
import { i18nProvider } from './lib/i18nProvider'
import { GameLayout } from './app/Game/Layout'
import { GameDashboard } from './app/Game/Dashboard'
import ConnectionList from './app/Connections/List'
import ConnectionCreate from './app/Connections/Create'
import ConnectionEdit from './app/Connections/Edit'

function App() {
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      i18nProvider={i18nProvider}
      layout={GameLayout}
      dashboard={GameDashboard}
      ready={GameDashboard}
      disableTelemetry
    >
      <Resource name="connections" list={ConnectionList} create={ConnectionCreate} edit={ConnectionEdit} />
    </Admin>
  )
}

export default App
