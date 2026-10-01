import LanguageSwitcher from '../common/LanguageSwitcher';
import { useTranslation } from '../../i18n/useTranslation';
import { useEffect, useRef } from 'react';
import Button from './Button';
export default function Modal({ title, children, onClose }) {
  const { t } = useTranslation();
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className="modal" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="section-heading"><h2>{title}</h2><LanguageSwitcher/><Button variant="ghost" onClick={onClose} aria-label={t('common.close')}>×</Button></div>{children}
  </dialog>;
}
