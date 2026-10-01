import { useTranslation } from '../../i18n/useTranslation';
import { useEffect, useState } from 'react';
import ShipLane from './ShipLane';
import DolphinManager from './DolphinManager';
import TreasureIsland from './TreasureIsland';
import { getShipLayout } from '../../logic/movementRules';
import { PHASE } from '../../data/defaultGameSettings';
export default function OceanScene({ game, decorative = false }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const layout = getShipLayout(game.teams.length);
  const safePage = Math.min(page, layout.pages - 1);
  useEffect(() => {
    if (layout.pages <= 1 || [PHASE.ROUND_ANIMATION, PHASE.PAUSED].includes(game.phase)) return;
    const timer = setInterval(() => setPage(p => (p + 1) % layout.pages), 12000);
    return () => clearInterval(timer);
  }, [layout.pages, game.phase]);
  const teams = game.teams.slice(safePage * layout.pageSize, (safePage + 1) * layout.pageSize);
  const animate = game.phase === PHASE.ROUND_ANIMATION || (game.phase === PHASE.PAUSED && game.pausedPhase === PHASE.ROUND_ANIMATION);
  return <div className={`ocean-scene ${decorative ? 'decorative' : ''} ${game.phase === PHASE.PAUSED ? 'world-paused' : ''}`}>
    <div className="ocean-sheen"/><div className="ocean-waves"/>{!decorative && <DolphinManager/>}
    <div className="distant-island island-one"/><div className="distant-island island-two"/>
    <div className="birds">⌁ <span>⌁</span> ⌁</div>
    <div className="island-destination"><span className="island-title">{t('ocean.island')}<span>{t('ocean.fortune')}</span></span><TreasureIsland showChest={!teams.some(team => team.status === 'FINISHED')}/></div>
    <div className="race-lanes" style={{ '--lanes': Math.max(teams.length, 1), '--ship-scale': layout.shipScale }}>
      {teams.map(team => <ShipLane key={`${team.id}-${game.questionIndex}-${animate}`} team={team} game={game} animate={animate}/>)}
      {!teams.length && <div className="ocean-empty"><h2>{t('ocean.empty')}</h2><p>{t('ocean.addCrews')}</p></div>}
    </div>
    <div className="ocean-compass">{t('ocean.north')}<span>✧</span>{t('ocean.south')}</div>
    {layout.pages > 1 && <div className="fleet-pagination"><button onClick={() => setPage((safePage + layout.pages - 1) % layout.pages)} aria-label={t('ocean.previous')}>←</button><span>{t('ocean.fleet', { page: safePage + 1, total: layout.pages })}</span><button onClick={() => setPage((safePage + 1) % layout.pages)} aria-label={t('ocean.next')}>→</button></div>}
  </div>;
}
