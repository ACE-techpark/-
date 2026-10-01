import { useTranslation } from '../../i18n/useTranslation';
import { useGameStore } from '../../store/gameStore';
import { PHASE } from '../../data/defaultGameSettings';
import Button from '../common/Button';
import Icon from '../common/Icon';
const steps = [
  [PHASE.READY, 'SHOW_QUESTION', 'control.show'],
  [PHASE.QUESTION_ACTIVE, 'LOCK_ANSWERS', 'control.lock'],
  [PHASE.ANSWERS_LOCKED, 'REVEAL_ANSWER', 'control.reveal'],
  [PHASE.ANSWER_REVEAL, 'PROCESS_ROUND', 'control.process'],
  [PHASE.NEXT_ROUND, 'NEXT_QUESTION', 'control.next'],
];
export default function GameControls({ onConfirm }) {
  const { t } = useTranslation();
  const { game, act } = useGameStore();
  const setup = [PHASE.SETUP, PHASE.LOBBY].includes(game.phase);
  const finished = game.phase === PHASE.GAME_FINISHED;
  const paused = game.phase === PHASE.PAUSED;
  return <section className="control-panel"><div className="section-heading"><div><span className="eyebrow">{t('control.title')}</span><h2>{setup ? t('control.ready') : finished ? t('control.finished') : t('common.roundOf', { round: game.questionIndex + 1, total: game.questions.length })}</h2></div><Icon name="compass" size={32}/></div>
    {setup ? <><p>{t('control.intro')}</p><Button className="wide" onClick={() => act('START_GAME')}><Icon name="play" size={18}/> {t('control.start')}</Button></> : <>
      <div className="phase-label">{t(`phase.${game.phase}`)}</div>
      <div className="control-steps">{steps.map(([phase, action, label]) => <Button key={action} variant={game.phase === phase ? 'primary' : 'secondary'} disabled={game.phase !== phase} onClick={() => act(action)}>{t(label)}{game.phase === phase && <Icon name="arrow" size={18}/>}</Button>)}</div>
      {game.phase === PHASE.ROUND_ANIMATION && <p role="status">{t('control.moving')}</p>}
      <div className="control-bottom"><Button variant="secondary" disabled={finished} onClick={() => act(paused ? 'RESUME_GAME' : 'PAUSE_GAME')}>{paused ? t('control.resume') : t('control.pause')}</Button><Button variant="danger" disabled={finished} onClick={() => onConfirm('end')}>{t('control.end')}</Button></div>
    </>}
    <button className="text-button subtle" onClick={() => onConfirm('reset')}>{finished ? t('control.restart') : t('control.reset')}</button>
  </section>;
}
