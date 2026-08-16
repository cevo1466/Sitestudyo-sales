import { useState } from 'react';
import { getConnection, hasToken } from './services/api';
import { ConnectionScreen } from './features/connection/ConnectionScreen';
import { LoginScreen } from './features/auth/LoginScreen';
import { CompaniesScreen } from './features/companies/CompaniesScreen';

type Stage = 'connect' | 'login' | 'app';

export function App() {
  // Kayitli adres varsa dogrudan girise geciyoruz: adresi her acilista
  // tekrar sormak, gunde bes kez acilan bir aracta gereksiz surtunme.
  const [stage, setStage] = useState<Stage>(() =>
    getConnection() ? (hasToken() ? 'app' : 'login') : 'connect',
  );
  const [user, setUser] = useState<string>('');

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
          <button aria-current="page">İşletmeler</button>
          <button>Huni</button>
          <button>Ayarlar</button>
        </nav>
        <div className="topbar-right">{user}</div>
      </header>
      <CompaniesScreen />
    </div>
  );
}
