import { useTranslation } from '../../i18n/useTranslation';
import { useEffect, useId, useRef, useState } from 'react';
import { IMAGE_TYPES, prepareQuestionImage } from '../../utils/questionImage';
import QuestionImage from '../common/QuestionImage';
import Button from '../common/Button';

export default function QuestionImageUpload({ question, onChange, onBusyChange }) {
  const { t, errorText } = useTranslation();
  const id = useId();
  const request = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => () => { request.current++; }, []);
  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const current = ++request.current;
    setBusy(true); onBusyChange(true); setError('');
    try {
      const imageUrl = await prepareQuestionImage(file);
      if (current === request.current) onChange({ imageUrl });
    } catch (err) { if (current === request.current) setError(err.message); }
    finally { if (current === request.current) { setBusy(false); onBusyChange(false); } }
  }
  return <fieldset className="question-image-upload">
    <legend>{t('image.title')} <span>{t('common.optional')}</span></legend>
    <label className="button secondary image-file-button" htmlFor={id}>{question.imageUrl ? t('image.replace') : t('image.upload')}</label>
    <input className="image-file-input" id={id} type="file" accept={IMAGE_TYPES.join(',')} disabled={busy} onChange={upload} aria-describedby={`${id}-help`}/>
    <p id={`${id}-help`} className="form-note">{t('image.help')}</p>
    {busy && <p role="status">{t('image.preparing')}</p>}
    {error && <p className="image-upload-error" role="alert">{errorText(error)}</p>}
    {question.imageUrl && <><QuestionImage question={question}/>
      <label>{t('image.description')}<input maxLength="200" value={question.imageAlt || ''} placeholder={t('image.hint')} onChange={e => onChange({ imageAlt: e.target.value })}/></label>
      <Button type="button" variant="secondary" disabled={busy} onClick={() => { onChange({ imageUrl: '', imageAlt: '' }); setError(''); }}>{t('image.remove')}</Button>
    </>}
  </fieldset>;
}
