import { useTranslation } from '../../i18n/useTranslation';
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import Button from '../common/Button';
export default function GameSetup({ onNew }) {
  const { t, gameName } = useTranslation();
  const { game, act } = useGameStore();
  const [name, setName] = useState(game.nameKey ? null : game.name);
  const [description, setDescription] = useState(game.description);
  const [saved, setSaved] = useState(false);
  return <section className="panel"><div className="section-heading"><div><h2>{t('setup.heading')}</h2><p>{t('setup.intro')}</p></div></div>
    <form className="editor-form" onSubmit={async e => { e.preventDefault(); setSaved(await act('SAVE_GAME', { name: name ?? gameName(game), description })); }}>
      <label>{t('setup.name')}<input required maxLength="80" value={name ?? gameName(game)} onChange={e => { setSaved(false); setName(e.target.value); }}/></label>
      <label>{t('setup.description')} <span className="muted">{t('common.optional')}</span><textarea maxLength="300" value={description} onChange={e => { setSaved(false); setDescription(e.target.value); }}/></label>
      <div className="form-actions"><Button variant="secondary" type="button" onClick={onNew}>{t('setup.new')}</Button><Button type="submit">{saved ? t('setup.saved') : t('setup.save')}</Button></div>
    </form></section>;
}
