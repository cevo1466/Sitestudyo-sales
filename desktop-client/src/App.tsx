import { useState } from 'react';
import { getConnection, hasToken } from './services/api';
import { ConnectionScreen } from './features/connection/ConnectionScreen';
import { LoginScreen } from './features/auth/LoginScreen';
import { CompaniesScreen } from './features/companies/CompaniesScreen';
import { PipelineScreen } from './features/pipeline/PipelineScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';

type Stage = 'connect' | 'login' | 'app';
type Tab = 'companies' | 'pipeline' | 'settings';

const TABS: Array<[Tab, string]> = [
  ['companies', 'İşletmeler'],
  ['pipeline', 'Huni'],
  ['settings', 'Ayarlar'],
];

export function App() {
  // Kayitli adres varsa dogrudan girise geciyoruz: adresi her acilista
  // tekrar sormak, gunde bes kez acilan bir aracta gereksiz surtunme.
  const [stage, setStage] = useState<Stage>(() =>
    getConnection() ? (hasToken() ? 'app' : 'login') : 'connect',
  );
  const [user, setUser] = useState<string>('');
  const [tab, setTab] = useState<Tab>('companies');

  if (stage === 'connect') return <ConnectionScreen onReady={() => setStage('login')} />;
  if (stage === 'login')
    return (
      <LoginScreen
        onIn={(name) => {
          setUser(name);
          setStage('app');
        }}
      />
    );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          SiteStudyo <small>Sales OS</small>
        </div>
        <nav className="nav">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              aria-current={tab === key ? 'page' : undefined}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="topbar-right">{user}</div>
      </header>

      {tab === 'companies' && <CompaniesScreen />}
      {tab === 'pipeline' && <PipelineScreen onGoToCompanies={() => setTab('companies')} />}
      {tab === 'settings' && <SettingsScreen />}
    </div>
  );
}
