import LanguageSwitcher from '../common/LanguageSwitcher';
import { useTranslation } from '../../i18n/useTranslation';
import QuestionImage from '../common/QuestionImage';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { PHASE } from '../../data/defaultGameSettings';
import Icon from '../common/Icon';
import Button from '../common/Button';
import Modal from '../common/Modal';
import TeamEditor from './TeamEditor';
import QuestionEditor from './QuestionEditor';
import GameSetup from './GameSetup';
import GameControls from './GameControls';
import LiveTeamStatus from './LiveTeamStatus';
import PirateShip from '../game/PirateShip';
import AudioControls from '../common/AudioControls';
import NetworkStatus from '../common/NetworkStatus';
import TeamJoinCard from './TeamJoinCard';

export default function AdminPanel() {
  const { t, content, gameName, errorText } = useTranslation();
  const { game, act, connection } = useGameStore();
  const [tab, setTab] = useState('crew');
  const [modal, setModal] = useState(null);
  const editable = [PHASE.SETUP, PHASE.LOBBY].includes(game.phase);
  const close = () => setModal(null);
  const confirm = async () => {
    const actions = { reset: ['RESET_GAME'], end: ['END_GAME'], new: ['CREATE_GAME'], deleteTeam: ['REMOVE_TEAM', { id: modal.item?.id }], deleteQuestion: ['REMOVE_QUESTION', { id: modal.item?.id }] };
    if (await act(...actions[modal.type])) close();
  };
  return <div className="admin-shell"><aside className="sidebar"><Link className="brand" to="/"><span className="brand-icon"><Icon name="anchor" size={28}/></span><span>{t('app.brand')}</span></Link>
    <div className="sidebar-label">{t('admin.commandDeck')}</div><nav><button className={tab === 'crew' ? 'selected' : ''} onClick={() => setTab('crew')}><Icon name="users"/> {t('admin.fleetCrew')} <span>{game.teams.length}</span></button><button className={tab === 'questions' ? 'selected' : ''} onClick={() => setTab('questions')}><Icon name="compass"/> {t('admin.questions')} <span>{game.questions.length}</span></button><button className={tab === 'setup' ? 'selected' : ''} onClick={() => setTab('setup')}><Icon name="flag"/> {t('admin.settings')}</button><button className={tab === 'live' ? 'selected' : ''} onClick={() => setTab('live')}><Icon name="screen"/> {t('admin.live')}</button></nav>
    <div className="sidebar-bottom"><NetworkStatus host/><p>{t('admin.scanWifi')}<br/>{t('admin.serverSave')}</p><div className="game-id">{game.gameId}</div><Link to="/">{t('common.backHarborArrow')}</Link></div></aside>
    <main className="admin-main"><header className="admin-topbar"><div className="breadcrumb">{t('landing.captain')} <span>/</span> {editable ? t('admin.setup') : t('admin.liveVoyage')}</div><div className="top-actions"><LanguageSwitcher/><AudioControls/><Link className="button secondary" to={`/game?gameId=${game.gameId}`} target="_blank"><Icon name="screen" size={18}/> {t('admin.openGame')}</Link></div></header>
    {!connection.ready && <div className="notice" role="status">
      <strong>{connection.routeError ? errorText(connection.routeError) : t('network.connecting')}</strong>
      <p>{t('network.wait')}</p>
      {import.meta.env.DEV && <p>{t('network.startServer')}</p>}
    </div>}
    <div className="admin-content" inert={!connection.ready}><div className="page-heading"><div><span className="eyebrow">{t('admin.eyebrow')}</span><h1>{gameName(game)}</h1><p>{game.description || t('admin.intro')}</p></div><span className="badge"><i/>{editable ? t('admin.preparing') : game.phase === PHASE.GAME_FINISHED ? t('admin.complete') : t('admin.progress')}</span></div>
      <div className="stats-grid"><div><span className="stat-icon coral"><Icon name="flag"/></span><strong>{game.teams.length}</strong><span>{t('admin.ships')}</span></div><div><span className="stat-icon mint"><Icon name="users"/></span><strong>{game.teams.reduce((sum, t) => sum + t.crewRemaining, 0)}</strong><span>{t('admin.pirates')}</span></div><div><span className="stat-icon gold"><Icon name="compass"/></span><strong>{game.questions.length}</strong><span>{t('admin.questionCount')}</span></div></div>
      <div className="dashboard-grid"><div className="dashboard-body">
      {!editable && tab !== 'live' && <div className="notice">{t('admin.editNotice')}</div>}
      {tab === 'crew' && <section><div className="section-heading"><div><h2>{t('admin.fleet')} <span className="count">{game.teams.length}</span></h2><p>{t('admin.fleetIntro')}</p></div><Button disabled={!editable} onClick={() => setModal({ type: 'team' })}><Icon name="plus" size={18}/> {t('team.add')}</Button></div>
        <div className="team-grid">{game.teams.map(team => <article className="team-card" key={team.id} style={{ '--team-color': team.shipColor }}><div className="ship-preview"><PirateShip team={team}/><span className="crew-pill"><Icon name="users" size={14}/>{t('common.pirates', { count: team.crewRemaining })}</span></div><div className="team-card-info"><h3><span className="team-dot" style={{ background: team.shipColor }}/>{team.name}</h3><TeamJoinCard team={team}/><div className="team-card-actions"><div><button disabled={!editable} onClick={() => setModal({ type: 'team', item: team })}>{t('common.edit')}</button><button aria-label={t('common.deleteTeam', { name: team.name })} disabled={!editable} onClick={() => setModal({ type: 'deleteTeam', item: team })}>×</button></div></div></div></article>)}
          <button className="add-team-card" disabled={!editable} onClick={() => setModal({ type: 'team' })}><span><Icon name="plus" size={26}/></span><strong>{t('team.newAwaits')}</strong><small>{t('team.addAnother')}</small></button></div></section>}
      {tab === 'questions' && <section><div className="section-heading"><div><h2>{t('admin.questions')} <span className="count">{game.questions.length}</span></h2><p>{t('question.intro')}</p></div><Button disabled={!editable} onClick={() => setModal({ type: 'question' })}><Icon name="plus" size={18}/> {t('question.add')}</Button></div><div className="question-list">{game.questions.map((q, i) => <article className="question-card" key={q.id}><span className="question-number">{String(i + 1).padStart(2, '0')}</span><div><QuestionImage question={q}/><h3>{content(q)}</h3><p>{t('common.correctLabel')} {content(q.answers.find(a => a.id === q.correctAnswerId))}</p></div><div className="question-actions"><button aria-label={t('common.moveUp', { number: i + 1 })} disabled={!editable || i === 0} onClick={() => act('REORDER_QUESTION', { id: q.id, direction: -1 })}>↑</button><button aria-label={t('common.moveDown', { number: i + 1 })} disabled={!editable || i === game.questions.length - 1} onClick={() => act('REORDER_QUESTION', { id: q.id, direction: 1 })}>↓</button><button disabled={!editable} onClick={() => setModal({ type: 'question', item: q })}>{t('common.edit')}</button><button aria-label={t('common.deleteQuestion', { number: i + 1 })} disabled={!editable} onClick={() => setModal({ type: 'deleteQuestion', item: q })}>×</button></div></article>)}{!game.questions.length && <div className="empty-state"><Icon name="compass" size={44}/><h3>{t('question.empty')}</h3><p>{t('question.addFirst')}</p></div>}</div></section>}
      {tab === 'setup' && (editable ? <GameSetup key={game.name} onNew={() => setModal({ type: 'new' })}/> : <div className="panel"><h2>{gameName(game)}</h2><p>{game.description}</p></div>)}
      {tab === 'live' && <section className="panel"><div className="section-heading"><div><h2>{t('admin.fleetLive')}</h2><p>{t('admin.liveIntro')}</p></div></div><LiveTeamStatus/></section>}
      </div><aside className="dashboard-right"><GameControls onConfirm={type => setModal({ type })}/><div className="rules-card"><span className="eyebrow">{t('rules.title')}</span><h3>{t('rules.heading')}</h3><p><span className="rule-symbol correct">✓</span><span><b>{t('rules.right')}</b><br/>{t('rules.rightDetail')}</span></p><p><span className="rule-symbol wrong">×</span><span><b>{t('rules.wrong')}</b><br/>{t('rules.wrongDetail')}</span></p><p><span className="rule-symbol">⚑</span><span><b>{t('rules.last')}</b><br/>{t('rules.lastDetail')}</span></p><div>{t('rules.ranking')}</div></div>
      {import.meta.env.DEV && <button className="demo-button" disabled={!editable} onClick={async () => { if (game.teams.length || game.questions.length) setModal({ type: 'demo' }); else act('LOAD_DEMO'); }}>{t('admin.demo')} <span>{t('admin.dev')}</span></button>}
      </aside></div><footer className="admin-footer"><Icon name="anchor" size={16}/> {t('common.fairWind')} <span>{t('admin.footer')}</span></footer></div></main>
      {modal?.type === 'team' && <Modal title={modal.item ? t('modal.editCrew') : t('modal.newCrew')} onClose={close}><TeamEditor team={modal.item} onClose={close}/></Modal>}
      {modal?.type === 'question' && <Modal title={modal.item ? t('modal.editQuestion') : t('modal.newQuestion')} onClose={close}><QuestionEditor question={modal.item} onClose={close}/></Modal>}
      {modal && !['team', 'question'].includes(modal.type) && <Modal title={{ reset: t('modal.reset'), end: t('modal.end'), new: t('modal.new'), deleteTeam: t('modal.deleteTeam'), deleteQuestion: t('modal.deleteQuestion'), demo: t('modal.demo') }[modal.type]} onClose={close}><p>{modal.type === 'reset' ? t('modal.resetDetail') : modal.type === 'end' ? t('modal.endDetail') : modal.type === 'new' || modal.type === 'demo' ? t('modal.replaceDetail') : t('modal.deleteDetail')}</p><div className="form-actions"><Button variant="secondary" onClick={close}>{t('common.cancel')}</Button><Button onClick={modal.type === 'demo' ? async () => { if (await act('LOAD_DEMO')) close(); } : confirm}>{t('common.confirm')}</Button></div></Modal>}
  </div>;
}

