import { useTranslation } from '../../i18n/useTranslation';
import { useState } from 'react';
import PirateShip from './PirateShip';
import { getShipWorldPosition } from '../../logic/movementRules';
import { presentationElapsed } from '../../logic/presentationTiming';

export default function ShipLane({ team, game, animate }) {
  const { t } = useTranslation();
  // Capture elapsed time only on mount, including joining/refreshing mid-round.
  // CSS pauses in place when the host pauses, without restarting on snapshots.
  const [elapsed] = useState(() => animate ? presentationElapsed(game) : 0);
  const result = game.roundResults.find(r => r.teamId === team.id);
  const progress = getShipWorldPosition(team.progress, game.questions.length, game.settings);
  const previous = getShipWorldPosition(result?.previousProgress ?? team.progress, game.questions.length, game.settings);
  const moving = animate && result?.correct && progress > previous;
  return <div className="race-lane"><div className="lane-route"/>
    <div className={`ship-position ${moving ? 'ship-moving' : ''} ${team.status === 'FINISHED' ? 'ship-arrived' : ''}`} style={{ left: `${progress * 76}%`, '--from-left': `${previous * 76}%`, '--to-left': `${progress * 76}%`, '--round-delay': `${-elapsed}ms`, '--team-color': team.shipColor }}>
      <div className="race-ship-art"><PirateShip team={team} result={result} animate={animate} showArrival/></div>
      <div className="ship-nameplate"><span className="team-dot" style={{ background: team.shipColor }}/><strong>{team.name}</strong><span>{team.status === 'ELIMINATED' ? t('ocean.sunk') : t('common.crewCount', { count: team.crewRemaining })}</span></div>
      {animate && result && <span className={`round-indicator ${result.correct ? 'positive' : 'negative'}`}>{result.finished ? t('ocean.land') : result.correct ? t('ocean.sail') : t('ocean.crewLost')}</span>}
    </div>
  </div>;
}
