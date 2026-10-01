import LanguageSwitcher from '../common/LanguageSwitcher';
import { useTranslation } from '../../i18n/useTranslation';
import { Link } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { PHASE } from '../../data/defaultGameSettings';
import TreasureIsland from './TreasureIsland';
import Icon from '../common/Icon';
export default function FinishPodium() {
  const { t, gameName } = useTranslation();
  const { game } = useGameStore();
  if (game.phase !== PHASE.GAME_FINISHED) return <main className="results-screen"><div className="results-language"><LanguageSwitcher/></div><div className="results-heading"><Icon name="compass" size={54}/><h1>{t('results.wait')}</h1><p>{t('results.waitDetail')}</p><Link className="button primary" to="/game">{t('results.watch')}</Link></div></main>;
  const podium = game.rankings.filter(t => t.status !== 'ELIMINATED' && t.finalRank <= 3);
  const noSurvivors = !game.teams.some(t => t.status !== 'ELIMINATED');
  return <main className="results-screen"><div className="results-language"><LanguageSwitcher/></div><Link className="game-logo" to="/"><Icon name="anchor"/> {t('app.brand')}</Link><div className="confetti" aria-hidden="true">{Array.from({ length: 36 }, (_, i) => <i key={i} style={{ left: `${(i * 17) % 100}%`, animationDelay: `${i * -.31}s`, background: ['#ffcc69', '#ff897b', '#83e0c6', '#c1a2ff'][i % 4] }}/>)}</div><TreasureIsland className="results-island"/><div className="results-heading"><span className="eyebrow">{gameName(game)} · {t('results.final')}</span><h1>{noSurvivors ? t('results.seaWins') : t('results.legendary')}</h1><p>{noSurvivors ? t('results.noSurvivors') : t('results.toast')}</p></div>
    <div className="podium">{podium.map(team => <article key={team.id} className={`podium-card place-${team.finalRank}`} style={{ '--team-color': team.shipColor }}><span className="podium-medal"><Icon name="trophy" size={34}/></span><span className="eyebrow">{team.finalRank === 1 ? t('results.first') : team.finalRank === 2 ? t('results.second') : t('results.third')}</span><h2>{team.name}</h2><p>{t('common.aboard', { count: team.crewRemaining })}</p><small>{team.finishRound ? t('results.reached', { round: team.finishRound }) : t('results.notReached', { points: team.progress })}</small><strong className="podium-rank">{team.finalRank}</strong></article>)}</div>
    <section className="final-standings"><h2>{t('results.story')}</h2>{game.rankings.map(team => <div key={team.id}><b>{team.finalRank}</b><span className="team-dot" style={{ background: team.shipColor }}/><strong>{team.name}</strong><span>{t('common.pointsCrew', { points: team.progress, crew: team.crewRemaining })}</span><small>{team.status === 'FINISHED' ? t('results.arrivedRound', { round: team.finishRound }) : team.status === 'ELIMINATED' ? t('results.lost') : t('results.afloat')}</small></div>)}<p>{t('results.rules')}</p></section><div className="results-actions"><Link className="button primary" to="/admin">{t('results.back')} <Icon name="arrow" size={18}/></Link></div>
  </main>;
}
