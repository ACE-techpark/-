import { useTranslation } from '../../i18n/useTranslation';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getTeamJoinUrl, isPhoneAccessibleUrl } from '../../config/networkConfig';
import { useGameStore } from '../../store/gameStore';
import Modal from '../common/Modal';
export default function TeamJoinCard({ team }) {
  const { t, connectionText } = useTranslation();
  const { game, act } = useGameStore();
  const [large, setLarge] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [regenerate, setRegenerate] = useState(false);
  const url = getTeamJoinUrl(team.joinToken);
  const canScan = isPhoneAccessibleUrl(url);
  async function copy() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
      else {
        // Clipboard API requires HTTPS; this fallback supports plain HTTP Wi-Fi play.
        const input = document.createElement('textarea'); input.value = url;
        input.style.position = 'fixed'; input.style.opacity = '0'; document.body.append(input); input.select();
        const copied = document.execCommand('copy'); input.remove();
        if (!copied) throw new Error(t('join.copyManually'));
      }
      setFeedback('join.copied');
    } catch { setFeedback('join.copyManually'); }
  }
  return <div className="team-join-card">
    <div className="team-presence"><span className={`presence-dot ${team.connection?.replaceAll(' ', '-').toLowerCase()}`}/>{connectionText(team.connection)}
      <strong>{game.answers[team.id] ? t('status.answered') : team.status === 'ACTIVE' ? t('status.waiting') : t(`status.${team.status}`)}</strong></div>
    <span className="ship-color-label">{t('join.color')} <i style={{ background: team.shipColor }}/>{team.shipColor}</span>
    {canScan ? <button className="qr-button" aria-label={t('join.enlarge', { name: team.name })} onClick={() => setLarge(true)}>
      <QRCodeSVG value={url} size={128} marginSize={4}/><span>{t('join.scan')}</span></button>
      : <p className="qr-warning">{t('join.localhost')}</p>}
    <label className="join-url">{t('join.link')}<input readOnly value={url} aria-label={t('join.linkFor', { name: team.name })} onFocus={e => e.target.select()}/></label>
    <div className="join-actions"><button onClick={copy}>{t('join.copy')}</button><button disabled={!canScan} onClick={() => setLarge(true)}>{t('join.showLarge')}</button><Link target="_blank" to={`/team/${team.joinToken}`}>{t('join.open')}</Link>
      <button onClick={() => setRegenerate(true)}>{t('join.regenerate')}</button></div>
    <span className="copy-feedback" role="status">{feedback && t(feedback)}</span>
    {large && <Modal title={team.name} onClose={() => setLarge(false)}><div className="large-qr"><QRCodeSVG value={url} size={320} marginSize={4}/><p>{url}</p></div></Modal>}
    {regenerate && <Modal title={t('join.regenerateTitle')} onClose={() => setRegenerate(false)}><p>{t('join.regenerateDetail')}</p><div className="form-actions"><button className="button secondary" onClick={() => setRegenerate(false)}>{t('common.cancel')}</button><button className="button primary" onClick={async () => { if (await act('REGENERATE_TOKEN', { id: team.id })) setRegenerate(false); }}>{t('join.regenerateConfirm')}</button></div></Modal>}
  </div>;
}
