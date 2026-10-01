import { useTranslation } from '../../i18n/useTranslation';
import { memo, useId } from 'react';
import CrewMember from './CrewMember';
import IslandFinishScene from './IslandFinishScene';
import WindEffect from './WindEffect';
function PirateShip({ team, result, animate = false, showArrival = false }) {
  const { t } = useTranslation();
  const id = useId().replaceAll(':', '');
  const sinking = animate && result?.eliminated;
  const gone = team.status === 'ELIMINATED' && !sinking;
  return <svg className={`pirate-ship ${animate && result?.correct ? 'sailing' : ''} ${sinking ? 'sinking' : ''} ${gone ? 'sunken' : ''}`} viewBox="0 0 290 230" role="img" aria-label={t('ocean.shipAlt', { name: team.name, count: team.crewRemaining })}>
    <defs><linearGradient id={`${id}-hull`} x2="0" y2="1"><stop stopColor="#b97847"/><stop offset="1" stopColor="#663e32"/></linearGradient><linearGradient id={`${id}-sail`} x2="1" y2="1"><stop stopColor="#fff9df"/><stop offset="1" stopColor="#e9d6aa"/></linearGradient></defs>
    <ellipse className="ship-shadow" cx="146" cy="201" rx="113" ry="14" fill="#075c6d" opacity=".18"/>
    <g className="wake" fill="none" stroke="#d1fffa" strokeWidth="3" opacity=".7"><path d="M32 196q-36 8-22 13m39-2q-19 9-30 5M251 198q32 0 30 8"/><ellipse cx="148" cy="204" rx="115" ry="12"/></g>
    <g className="ship-bob"><g className="ship-body">
      <path d="M65 161 48 138l29 3 7 22M215 152l38-22-10 38" fill="#7e5039"/>
      <path d="M48 159q99 15 210-6l-30 44q-69 33-143 0Z" fill={`url(#${id}-hull)`}/>
      <path d="M57 164q108 23 191-2l-9 17q-91 30-171 0Z" fill={team.shipColor}/>
      <path d="M79 193q83 23 150-3" stroke="#e1a765" strokeWidth="3" fill="none"/>
      {[104, 146, 188].map(x => <g key={x}><circle cx={x} cy="185" r="7" fill="#efc170"/><circle cx={x} cy="185" r="4" fill="#343f42"/></g>)}
      <path d="M142 154V31" stroke="#734c37" strokeWidth="7" strokeLinecap="round"/>
      <path d="M97 53h112M101 128h112" stroke="#7a513c" strokeWidth="5" strokeLinecap="round"/>
      <path className="sail" d="M105 55q21 38 0 71 57 18 105-2-19-37-6-69Z" fill={`url(#${id}-sail)`}/>
      <path d="M111 62q18 32 0 56" fill="none" stroke={team.shipColor} strokeWidth="7" opacity=".8"/>
      <g transform="translate(156 89)" fill="#354447"><path d="m-14 11 27 12m-28 0 28-12" stroke="#354447" strokeWidth="3" strokeLinecap="round"/><path d="M-10 0a11 11 0 1 1 20 0v8h-5v5H-5V8h-5Z"/><circle cx="-5" cy="0" r="3" fill="#f5e7c7"/><circle cx="5" cy="0" r="3" fill="#f5e7c7"/><path d="m0 4-2 3h4Z" fill="#f5e7c7"/></g>
      <path d="M145 29q17-14 44-2l-12 9 13 8q-24-10-45 0Z" fill={team.shipColor}/>
      <path d="M67 144 97 62M215 142 208 57" stroke="#ccb482" strokeWidth="1.5"/>
      {!(showArrival && team.status === 'FINISHED') && Array.from({ length: team.crewRemaining }, (_, i) => <CrewMember key={i} x={80 + i * 25} y={151} index={i}/>)}
      {animate && result?.crewLost > 0 && <CrewMember x={80 + (result.previousCrew - 1) * 25} y={151} index={result.previousCrew - 1} falling/>}
      <path d="M50 158q110 18 207-4" stroke="#efbf7b" strokeWidth="6" fill="none" strokeLinecap="round"/>
      {sinking && <g className="fire-effects">{[90, 140, 185].map((x, i) => <g key={x} style={{ animationDelay: `${i * .12}s` }}><ellipse className="smoke" cx={x} cy="115" rx="18" ry="24" fill="#6a7476" opacity=".7"/><path d={`M${x - 14} 167q-13-22 6-39 0 13 9 12 0-18 8-24 24 41 6 51Z`} fill="#ff8650"/><path d={`M${x - 5} 167q-6-17 8-27 0 10 9 15l-2 12Z`} fill="#ffdd73"/></g>)}</g>}
    </g></g>
    {animate && result?.crewLost > 0 && <g className="splash" fill="none" stroke="#e3fffc" strokeWidth="4"><ellipse cx="255" cy="211" rx="24" ry="6"/><path d="M240 202 233 194m17 7-2-14m13 15 8-12"/></g>}
    {sinking && <g className="sink-bubbles" fill="none" stroke="#c7fffb" strokeWidth="2"><circle cx="125" cy="209" r="7"/><circle cx="154" cy="202" r="5"/><circle cx="177" cy="216" r="4"/></g>}
    {animate && result?.correct && result.progress > result.previousProgress && <WindEffect/>}
    {showArrival && team.status === 'FINISHED' && <IslandFinishScene team={team} animate={animate && result?.finished}/>}
  </svg>;
}
export default memo(PirateShip);
