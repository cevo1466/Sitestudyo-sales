import { useEffect, useState } from 'react';
import {
  getConnection,
  hasToken,
  hasSession,
  restoreSession,
  setSessionLostHandler,
} from './services/api';
import { ConnectionScreen } from './features/connection/ConnectionScreen';
import { LoginScreen } from './features/auth/LoginScreen';
import { CompaniesScreen } from './features/companies/CompaniesScreen';
import { QueueScreen } from './features/queue/QueueScreen';
import { PipelineScreen } from './features/pipeline/PipelineScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { ThemeToggle } from './components/ThemeToggle';
import { UpdateButton } from './components/UpdateButton';

type Stage = 'connect' | 'login' | 'app';
type Tab = 'today' | 'companies' | 'pipeline' | 'settings';

// "Bugun" en basta: acilista sorulan ilk soru "kiminle konusacagim".
const TABS: Array<[Tab, string]> = [
  ['today', 'Bugün'],
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
  const [tab, setTab] = useState<Tab>('today');
  /**
   * Isletmeler ekranindan gelen kuyruk filtresi.
   *
   * Bos ise kuyruk kendi varsayilanini kuruyor (sicak + cep telefonlu +
   * bugun temas edilmemis).
   */
  const [queueParams, setQueueParams] = useState('');
  // Kayitli oturum varsa acilista sessizce geri getiriyoruz; her acilista
  // sifre sormak gunde bes kez acilan bir araci kullanilmaz yapardi.
  const [restoring, setRestoring] = useState(() => Boolean(getConnection()) && hasSession());

  useEffect(() => {
    // Oturum herhangi bir anda tamamen biterse (yenileme de reddedilirse)
    // kullaniciyi giris ekranina alalim — kirik bir ekranda birakmayalim.
    setSessionLostHandler(() => setStage('login'));
  }, []);

  useEffect(() => {
    if (!restoring) return;
    void restoreSession()
      .then((ok) => {
        if (ok) setStage('app');
      })
      .finally(() => setRestoring(false));
  }, [restoring]);

  if (restoring) {
    return (
      <div className="gate">
        <div className="gate-card">
          <p className="lede">Oturum geri getiriliyor…</p>
        </div>
      </div>
    );
  }

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
        <div className="topbar-right">
          <UpdateButton />
          <span>{user}</span>
          <ThemeToggle />
        </div>
      </header>

      {tab === 'today' && <QueueScreen initialParams={queueParams} />}
      {tab === 'companies' && (
        <CompaniesScreen
          onBuildQueue={(params) => {
            setQueueParams(params);
            setTab('today');
          }}
        />
      )}
      {tab === 'pipeline' && <PipelineScreen onGoToCompanies={() => setTab('companies')} />}
      {tab === 'settings' && <SettingsScreen />}
    </div>
  );
}
