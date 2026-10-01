import LanguageSwitcher from '../common/LanguageSwitcher';
import { useTranslation } from '../../i18n/useTranslation';
import { Link, useParams } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import PirateShip from '../game/PirateShip';
import NetworkStatus from '../common/NetworkStatus';
export default function TeamJoinScreen() {
  const { t } = useTranslation();
  const { joinToken } = useParams();
  const { connection } = useGameStore();
  const team = connection.joinInfo?.team;
  if (!team) return null;
  return <main className="team-screen"><header className="team-header"><b>{t('app.brand')}</b><div className="team-header-actions"><LanguageSwitcher/><NetworkStatus/></div></header>
    <div className="team-message"><span className="eyebrow">{t('join.calling')}</span><h1>{team.name}</h1>
      <div className="join-ship"><PirateShip team={team}/></div><p>{t('join.crew', { count: team.crewRemaining })}</p>
      {team.status === 'ACTIVE' && !connection.joinInfo.finished ? <Link className="button primary" to={`/team/${joinToken}`}>{t('join.as', { name: team.name })}</Link>
        : <><p>{t('error.teamFinished')}</p><Link className="button primary" to={`/team/${joinToken}`}>{t('join.view')}</Link></>}
      <p>{t('join.oneDevice')}</p>
    </div></main>;
}
