import { useTranslation } from '../../i18n/useTranslation';
import QuestionImage from '../common/QuestionImage';
import { PHASE, ANSWER_LABELS } from '../../data/defaultGameSettings';
export default function QuestionOverlay({ game }) {
  const { t, content } = useTranslation();
  const question = game.questions[game.questionIndex];
  const phase = game.phase === PHASE.PAUSED ? game.pausedPhase : game.phase;
  if (!question || [PHASE.SETUP, PHASE.LOBBY, PHASE.READY].includes(phase)) return <div className="question-overlay waiting-overlay"><span className="eyebrow">{phase === PHASE.READY ? t('game.readyRound', { round: game.questionIndex + 1 }) : t('game.aboutBegin')}</span><h2>{phase === PHASE.READY ? t('game.readyAnswers') : t('game.gather')}</h2><p>{t('game.waitQuestion')}</p></div>;
  const revealed = [PHASE.ANSWER_REVEAL, PHASE.ROUND_ANIMATION, PHASE.NEXT_ROUND, PHASE.GAME_FINISHED].includes(phase);
  return <section className={`question-overlay ${revealed ? 'revealed' : ''}`} key={question.id}><div className="question-meta"><span className="eyebrow">{t('common.questionUpper')} {game.questionIndex + 1} <span>/ {game.questions.length}</span></span><span>{revealed ? t('game.revealed') : phase === PHASE.ANSWERS_LOCKED ? t('game.locked') : t('game.answered', { count: Object.keys(game.answers).length, total: game.teams.filter(team => team.status === 'ACTIVE').length })}</span></div><div className={`question-prompt ${question.imageUrl ? 'with-image' : ''}`}><QuestionImage question={question}/><h2>{content(question)}</h2></div><div className="question-answers">{question.answers.map((answer, i) => <div className={`display-answer answer-${i} ${revealed && answer.id === question.correctAnswerId ? 'is-correct' : ''} ${revealed && answer.id !== question.correctAnswerId ? 'is-dimmed' : ''}`} key={answer.id}><b>{ANSWER_LABELS[i]}</b><span>{content(answer)}</span>{revealed && answer.id === question.correctAnswerId && <strong>✓</strong>}</div>)}</div></section>;
}
