import LanguageSwitcher from './common/LanguageSwitcher';
import { useTranslation } from '../i18n/useTranslation';
import { Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import Icon from './common/Icon';
import TreasureIsland from './game/TreasureIsland';
import PirateShip from './game/PirateShip';
export default function Landing() {
  const { t, gameName } = useTranslation();
  const { game } = useGameStore();
  const previewTeam = game.teams[0] || { name: t('landing.previewCrew'), shipColor: '#ff8976', crewRemaining: 4, status: 'ACTIVE' };
  return <main className="landing"><header><Link className="game-logo" to="/"><Icon name="anchor" size={28}/> {t('app.brand')}</Link><LanguageSwitcher/><span className="landing-tag">{t('landing.tag')}</span><Link to="/admin" className="button secondary">{t('landing.captain')} <Icon name="arrow" size={18}/></Link></header><section className="landing-hero"><div className="hero-copy"><span className="eyebrow"><span className="tiny-star">✦</span> {t('landing.eyebrow')}</span><h1>{t('landing.quick')}<br/>{t('landing.brave')}<br/><em>{t('landing.treasure')}</em></h1><p>{t('landing.intro')}</p><div className="hero-actions"><Link className="button primary" to="/admin"><Icon name="compass"/> {t('landing.host')} <Icon name="arrow" size={18}/></Link><Link className="button ghost" to={`/game${game.gameId ? `?gameId=${game.gameId}` : ""}`}><Icon name="screen" size={19}/> {t('landing.watch')}</Link></div><div className="hero-detail"><span><i/> {t('landing.crewRange')}</span><span>{t('landing.unlimited')}</span><span>{t('landing.together')}</span></div></div><div className="hero-world"><div className="hero-orbit"/><div className="hero-island"><TreasureIsland/></div><div className="hero-ship"><PirateShip team={previewTeam}/></div><span className="floating-note note-treasure">{t('landing.calling')}</span><span className="floating-note note-crew"><Icon name="users" size={19}/> {t('landing.yourCrew')}</span><div className="hero-ripples"/></div></section><section className="landing-rules"><div><span>01</span><Icon name="users" size={28}/><h3>{t('landing.gather')}</h3><p>{t('landing.shipEach')}</p></div><div><span>02</span><Icon name="compass" size={28}/><h3>{t('landing.knowledge')}</h3><p>{t('landing.answerRules')}</p></div><div><span>03</span><Icon name="trophy" size={28}/><h3>{t('landing.claim')}</h3><p>{t('landing.reachFirst')}</p></div></section>
    {!!game.teams.length && <section className="join-fleet"><div><span className="eyebrow">{t('landing.current')}</span><h2>{gameName(game)}</h2><p>{t('landing.privateCode')}</p></div><div>{game.teams.map(team => <div key={team.id} className="join-team"><span className="team-dot" style={{ background: team.shipColor }}/>{team.name}</div>)}</div></section>}
    <footer className="landing-footer"><span><Icon name="anchor" size={16}/> {t('common.fairWind')}</span><span>{t('landing.footer')}</span></footer>
  </main>;
}
