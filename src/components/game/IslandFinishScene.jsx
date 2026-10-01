import { useTranslation } from '../../i18n/useTranslation';
import CrewMember from './CrewMember';
import TreasureChest from './TreasureChest';

// Presentation only: the reducer has already marked the team FINISHED and ranked it.
// These coordinates share the ship's viewBox, so pirates start on its actual deck.
export default function IslandFinishScene({ team, animate }) {
  const { t } = useTranslation();
  return <g className={`island-finish-scene ${animate ? 'finish-playing' : 'finish-settled'}`} data-team-id={team.id} role="group" aria-label={t('ocean.arrivalAlt', { name: team.name, count: team.crewRemaining })}>
    <g className="arrival-shore">
      <ellipse cx="367" cy="209" rx="119" ry="25" fill="#c6fff0" opacity=".45"/>
      <path d="M272 196q-4-43 68-49 70-29 124 13 45 45-31 58-102 15-161-22Z" fill="#e1ac61"/>
      <path d="M269 187q10-43 72-44 70-26 121 13 32 31-26 44-109 17-167-13Z" fill="#f7dc97"/>
      <path d="M354 151q-8-18 12-22 43-13 65 16-34 18-77 6" fill="#87b96b"/>
      <path d="M248 186h58v12h-58Z" fill="#b78050" stroke="#855535" strokeWidth="2"/>
      <path d="M256 184v21m18-21v21m20-21v21" stroke="#795034" strokeWidth="4"/>
      <path d="m235 157 30 32 18-3-30-31Z" fill="#d7ac73" stroke="#90643e" strokeWidth="2"/>
      <g transform="translate(394 153)"><TreasureChest celebrating/></g>
    </g>
    {Array.from({ length: team.crewRemaining }, (_, i) => <g key={i} className="disembarking-crew" data-crew="ashore" style={{ '--walk-delay': `${2500 + i * 120}ms`, '--dock-x': `${265 - (80 + i * 25)}px`, '--walk-x': `${318 + i % 3 * 26 - (80 + i * 25)}px`, '--walk-y': `${20 + Math.floor(i / 3) * 28}px` }}>
      <g className="crew-celebration"><CrewMember x={80 + i * 25} y={151} index={i} location="island"/></g>
    </g>)}
  </g>;
}
