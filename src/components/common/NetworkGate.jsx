import LanguageSwitcher from '../common/LanguageSwitcher';
import { useTranslation } from '../../i18n/useTranslation';
import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { gameService } from '../../services/SocketGameService';
import { useGameStore } from '../../store/gameStore';
import NetworkStatus from './NetworkStatus';
import { getRouteContext } from '../../config/routeConfig';
export default function NetworkGate({ children }) {
  const { t, errorText } = useTranslation();
  const { pathname, search } = useLocation();
  const { connection } = useGameStore();
  const [gameId, setGameId] = useState('');
  useEffect(() => gameService.configure(pathname, search), [pathname, search]);
  const { mode } = getRouteContext(pathname);
  // Keep navigation and the host panel reachable even when the backend is offline.
  if (mode === 'landing' || mode === 'host') return children;
  if (!connection.ready) return <main className="team-screen"><div className="connection-language"><LanguageSwitcher/></div><div className="team-message">
    <NetworkStatus host={pathname === '/admin'}/><h1>{connection.routeError ? errorText(connection.routeError) : t('network.connecting')}</h1>
    {!connection.routeError && <p>{t('network.wait')}</p>}
    {['/game', '/results'].includes(pathname) && connection.routeError && <form action={pathname}>
      <label>{t('network.gameId')} <input name="gameId" required value={gameId} onChange={e => setGameId(e.target.value)}/></label>
      <button className="button primary">{t('network.open')}</button></form>}
    <Link className="button secondary" to="/">{t('common.backHarbor')}</Link>
  </div></main>;
  return children;
}
