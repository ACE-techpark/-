import { useTranslation } from '../../i18n/useTranslation';
import { useState } from 'react';
import { audioManager } from '../../services/audioManager';
import Icon from './Icon';
export default function AudioControls() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(audioManager.settings);
  const update = values => { const next = { ...settings, ...values }; setSettings(next); audioManager.configure(next); };
  return <details className="audio-controls"><summary aria-label={t('audio.settings')}><Icon name="sound"/> {t('audio.title')}</summary>
    <div className="audio-popover"><label className="check-label"><input type="checkbox" checked={!settings.mute} onChange={async e => { update({ mute: !e.target.checked }); await audioManager.unlock(); audioManager.play('correct'); }}/> {t('audio.enable')}</label>
      {['master', 'music', 'effects'].map(key => <label key={key}>{t(`audio.${key}`)}<input aria-label={t(`audio.${key}`)} type="range" min="0" max="1" step="0.05" value={settings[key]} onChange={e => update({ [key]: +e.target.value })}/></label>)}
      <small>{t('audio.note')}</small>
    </div>
  </details>;
}
