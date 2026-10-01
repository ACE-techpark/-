import LanguageSwitcher from '../common/LanguageSwitcher';
import { useTranslation } from '../../i18n/useTranslation';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { PHASE } from '../../data/defaultGameSettings';
import OceanScene from './OceanScene';
import QuestionOverlay from './QuestionOverlay';
import RankingPanel from './RankingPanel';
import FinishPodium from './FinishPodium';
import Icon from '../common/Icon';
import AudioControls from '../common/AudioControls';
import NetworkStatus from '../common/NetworkStatus';
import { audioManager } from '../../services/audioManager';
export default function GameScreen() {
  const { t, gameName } = useTranslation();
  const { game } = useGameStore();
  const lastCue = useRef('');
  useEffect(() => {
    const cueId = `${game.questionIndex}-${game.phase}`;
    if (cueId === lastCue.current) return;
    lastCue.current = cueId;
    if (game.phase === PHASE.ROUND_ANIMATION) audioManager.play(game.roundResults.some(r => r.eliminated) ? 'sinking' : game.roundResults.some(r => r.correct) ? 'correct' : 'splash');
    if (game.phase === PHASE.GAME_FINISHED) audioManager.play('victory');
  }, [game.phase, game.questionIndex, game.roundResults]);
  if (game.phase === PHASE.GAME_FINISHED) return <FinishPodium/>;
  return <main className="game-screen"><header className="game-hud"><Link className="game-logo" to="/"><Icon name="anchor" size={27}/> {t('app.brand')}</Link><div className="hud-title">{gameName(game)}<small>{game.phase === PHASE.SETUP ? t('game.waitHarbor') : t('common.roundUpper', { round: game.questionIndex + 1, total: game.questions.length })}</small></div><div className="hud-actions"><LanguageSwitcher/><NetworkStatus/><AudioControls/><button aria-label={t('game.fullscreen')} onClick={() => { const promise = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); promise?.catch(() => useGameStore.setState({ error: 'Fullscreen is unavailable in this browser window.' })); }}>⛶</button><Link to="/admin" aria-label={t('game.dashboard')}><Icon name="compass"/></Link></div></header>
    <OceanScene game={game}/><QuestionOverlay game={game}/><RankingPanel game={game}/>{game.phase === PHASE.PAUSED && <div className="pause-overlay"><Icon name="anchor" size={50}/><h1>{t('team.anchors')}</h1><p>{t('team.paused')}</p></div>}
  </main>;
}
