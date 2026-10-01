import { useTranslation } from '../../i18n/useTranslation';
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { createId } from '../../utils/ids';
import { SHIP_COLORS } from '../../data/defaultGameSettings';
import Button from '../common/Button';
export default function TeamEditor({ team, onClose }) {
  const { t } = useTranslation();
  const { game, act } = useGameStore();
  const [draft, setDraft] = useState(team || { id: createId(), name: '', crewInitial: game.settings.maxCrewSize, shipColor: SHIP_COLORS[game.teams.length % SHIP_COLORS.length] });
  const update = (key, value) => setDraft({ ...draft, [key]: value });
  return <form className="editor-form" onSubmit={async e => { e.preventDefault(); if (await act('SAVE_TEAM', draft)) onClose(); }}>
    <label>{t('team.name')}<input autoFocus required maxLength="60" placeholder={t('team.nameHint')} value={draft.name} onChange={e => update('name', e.target.value)}/></label>
    <label>{t('team.startingCrew')} <span className="muted">{t('team.crewRange', { min: game.settings.minCrewSize, max: game.settings.maxCrewSize })}</span><input type="number" min={game.settings.minCrewSize} max={game.settings.maxCrewSize} required value={draft.crewInitial} onChange={e => update('crewInitial', +e.target.value)}/></label>
    <label>{t('team.color')}</label><div className="color-options">{SHIP_COLORS.map(color => <button key={color} type="button" aria-label={t('team.colorOption', { color })} aria-pressed={draft.shipColor === color} style={{ background: color }} onClick={() => update('shipColor', color)}>{draft.shipColor === color ? '✓' : ''}</button>)}<input aria-label={t('team.customColor')} type="color" value={draft.shipColor} onChange={e => update('shipColor', e.target.value)}/></div>
    <p className="form-note">{t('team.crewHelp')}</p>
    <div className="form-actions"><Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit">{team ? t('team.save') : t('team.add')}</Button></div>
  </form>;
}
