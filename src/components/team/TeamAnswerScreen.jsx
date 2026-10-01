import LanguageSwitcher from '../common/LanguageSwitcher';
import { useTranslation } from '../../i18n/useTranslation';
import QuestionImage from '../common/QuestionImage';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { PHASE, ANSWER_LABELS } from '../../data/defaultGameSettings';
import PirateShip from '../game/PirateShip';
import Icon from '../common/Icon';
import NetworkStatus from '../common/NetworkStatus';
export default function TeamAnswerScreen() {
  const { t, content } = useTranslation();
  const { game, act } = useGameStore();
  const [submitting, setSubmitting] = useState(false);
  const team = game.teams.find(t => t.id === game.myTeamId);
  if (!team) return <main className="team-screen"><div className="team-message"><Icon name="compass" size={56}/><h1>{t('team.invalid')}</h1><p>{t('team.askNew')}</p><Link className="button primary" to="/">{t('common.backHarbor')}</Link></div></main>;
  const question = game.questions[game.questionIndex];
  const answer = game.answers[team.id];
  const active = game.phase === PHASE.QUESTION_ACTIVE && team.status === 'ACTIVE' && !answer;
  const revealed = [PHASE.ANSWER_REVEAL, PHASE.ROUND_ANIMATION, PHASE.NEXT_ROUND].includes(game.phase);
  const showQuestion = question && ![PHASE.SETUP, PHASE.LOBBY, PHASE.READY, PHASE.GAME_FINISHED].includes(game.phase);
  const message = game.phase === PHASE.GAME_FINISHED ? [t('team.complete'), t('team.placed')]
    : team.status === 'ELIMINATED' ? [t('team.brave'), t('team.sunk')]
    : team.status === 'FINISHED' ? [t('team.land'), t('team.reached')]
    : game.phase === PHASE.PAUSED ? [t('team.anchors'), t('team.paused')]
    : revealed ? [answer === question?.correctAnswerId ? t('common.correct') : t('common.wrong'), answer === question?.correctAnswerId ? t('team.correctDetail') : answer ? t('team.wrongDetail') : t('team.missed')]
    : answer ? [t('team.submitted'), t('team.waitResult')]
    : game.phase === PHASE.ANSWERS_LOCKED ? [t('team.closed'), t('team.waitReveal')]
    : [t('team.youConnected'), t('team.waitHost')];
  return <main className="team-screen" style={{ '--team-color': team.shipColor }}><header className="team-header"><Link to="/" className="game-logo"><Icon name="anchor"/> {t('app.brand')}</Link><div className="team-header-actions"><LanguageSwitcher/><NetworkStatus/></div></header><div className="team-content"><div className="team-identity"><div className="mini-ship"><PirateShip team={team}/></div><div><span className="eyebrow">{t('team.yourCrew')}</span><h1>{team.name}</h1><p>{t('common.aboard', { count: team.crewRemaining })} <span>·</span> {t('common.points', { count: team.progress })}</p></div></div>
    {showQuestion && <div className="team-question"><span className="eyebrow">{t('common.questionUpper')} {game.questionIndex + 1} / {game.questions.length}</span><QuestionImage question={question}/><h2>{content(question)}</h2></div>}
    {!active && <div className={`team-message ${revealed && answer === question?.correctAnswerId ? 'success-message' : ''}`} role="status"><span className="message-icon"><Icon name={answer ? 'check' : 'anchor'} size={36}/></span><h2>{message[0]}</h2><p>{message[1]}</p>{answer && showQuestion && <span className="submitted-answer">{t('team.yourAnswer')} {content(question.answers.find(a => a.id === answer))}</span>}
      {revealed && <><strong>{t('team.crewRemaining', { count: team.crewRemaining })}</strong>{game.phase === PHASE.NEXT_ROUND && team.status === 'ACTIVE' && <p>{t('team.waitNext')}</p>}</>}
      {game.phase === PHASE.GAME_FINISHED && <Link className="button primary" to={`/results?gameId=${game.gameId}`}>{t('team.standings')} <Icon name="trophy" size={18}/></Link>}</div>}
    {showQuestion && <>{active && <p className="answer-instruction">{t('team.choose')}</p>}<div className="team-answer-grid">{question.answers.map((option, i) => <button
      className={`team-answer answer-${i}${answer === option.id ? ' is-selected' : ''}${revealed && question.correctAnswerId === option.id ? ' is-correct' : ''}`}
      disabled={!active || submitting} aria-pressed={answer === option.id} key={option.id}
      onClick={async () => { setSubmitting(true); await act('SUBMIT_ANSWER', { teamId: team.id, questionId: question.id, answerId: option.id }); setSubmitting(false); }}
    ><b>{ANSWER_LABELS[i]}</b><span>{content(option)}</span></button>)}</div></>}
    <footer className="team-footer">{t('team.footer')}</footer>
  </div></main>;
}
