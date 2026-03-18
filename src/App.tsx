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
      authProvider={authProvider}
      dashboard={GameDashboard}
      dataProvider={dataProvider}
      disableTelemetry
      i18nProvider={i18nProvider}
      layout={GameLayout}
    >
      <Resource name="achievements" />
      <Resource name="agents" />
      <Resource name="apps" />
      <Resource name="blueprints" />
      <Resource
        name="connections"
        list={ConnectionList}
        create={ConnectionCreate}
        edit={ConnectionEdit}
      />
      <Resource name="experts" />
      <Resource name="features" />
      <Resource name="land_objects" />
      <Resource name="land_placements" />
      <Resource name="lands" />
      <Resource name="organizations" />
      <Resource name="quest_steps" />
      <Resource name="quests" />
      <Resource name="worlds" />
    </Admin>
  )
}

export default App
