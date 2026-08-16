import { useState } from 'react';
import { api, getConnection, setAccessToken, clearConnection, ApiError } from '../../services/api';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: string };
}

export function LoginScreen({ onIn }: { onIn: (name: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conn = getConnection();

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAccessToken(r.accessToken);
      onIn(r.user.name);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Giriş yapılamadı');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gate">
      <form className="gate-card" onSubmit={submit}>
        <h1>Giriş yapın</h1>
        <p className="lede">{conn?.serverName ?? 'Sales OS'}</p>

        {error && <div className="notice error">{error}</div>}

        <div className="field">
          <label htmlFor="email">E-posta</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="pw">Şifre</label>
          <input
            id="pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button className="btn" type="submit" disabled={busy || !email || !password}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
        <button
          type="button"
          className="btn secondary"
          style={{ marginTop: 'var(--space-4)' }}
          onClick={() => {
            clearConnection();
            location.reload();
          }}
        >
          Başka sunucuya bağlan
        </button>
      </form>
    </div>
  );
}
