import { useTranslation } from '../../i18n/useTranslation';
import { Link } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { PHASE, ANSWER_LABELS } from '../../data/defaultGameSettings';
import { raceDistance } from '../../logic/movementRules';
export default function LiveTeamStatus() {
  const { t, connectionText } = useTranslation();
  const { game } = useGameStore();
  const q = game.questions[game.questionIndex];
  const phase = game.phase === PHASE.PAUSED ? game.pausedPhase : game.phase;
  const revealed = [PHASE.ANSWER_REVEAL, PHASE.ROUND_ANIMATION, PHASE.NEXT_ROUND, PHASE.GAME_FINISHED].includes(phase);
  return <div className="table-wrap"><table><thead><tr><th>{t('live.team')}</th><th>{t('live.connection')}</th><th>{t('live.crew')}</th><th>{t('live.progress')}</th><th>{t('live.answer')}</th><th>{t('live.status')}</th><th>{t('live.rank')}</th><th>{t('live.teamView')}</th></tr></thead><tbody>
    {game.teams.map(team => {
      const answer = game.answers[team.id];
      const index = q?.answers.findIndex(a => a.id === answer) ?? -1;
      const participated = team.status === 'ACTIVE' || game.roundResults.some(r => r.teamId === team.id);
      return <tr key={team.id}><td><span className="team-dot" style={{ background: team.shipColor }}/>{team.name}</td><td>{connectionText(team.connection)}</td><td>{team.crewRemaining} / {team.crewInitial}</td><td>{team.progress} / {raceDistance(game.questions.length, game.settings)}</td><td>{answer ? `${t('status.answered')} · ${ANSWER_LABELS[index]}` : t('status.waiting')} {revealed && participated && (answer ? (answer === q?.correctAnswerId ? t('common.correctMark') : t('common.wrongMark')) : t('common.noAnswer'))}</td><td><span className={`status ${t(`status.${team.status}`)}`}>{t(`status.${team.status}`)}</span></td><td>{game.rankings.find(t => t.id === team.id)?.finalRank || '—'}</td><td><Link target="_blank" to={`/team/${team.joinToken}`}>{t('common.open')}</Link></td></tr>;
    })}
  </tbody></table></div>;
}
