import { useTranslation } from '../../i18n/useTranslation';
import { useGameStore } from '../../store/gameStore';
export default function NetworkStatus({ host = false }) {
  const { t, connectionText } = useTranslation();
  const { connection } = useGameStore();
  return <span className={`network-status ${connection.ready ? 'online' : 'offline'}`} aria-live="polite">
    <i/>{host ? t(connection.ready ? 'status.serverConnected' : 'status.serverDisconnected') : connectionText(connection.status)}
  </span>;
}
