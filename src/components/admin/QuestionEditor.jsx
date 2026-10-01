import { useTranslation } from '../../i18n/useTranslation';
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { createId } from '../../utils/ids';
import { ANSWER_LABELS } from '../../data/defaultGameSettings';
import Button from '../common/Button';
import QuestionImageUpload from './QuestionImageUpload';
export default function QuestionEditor({ question, onClose }) {
  const { t } = useTranslation();
  const { game, act } = useGameStore();
  const [imageBusy, setImageBusy] = useState(false);
  const [draft, setDraft] = useState(() => question || { id: createId(), type: 'multiple-choice', text: '', correctAnswerId: '',
    answers: Array.from({ length: game.settings.answersPerQuestion }, () => ({ id: createId(), text: '' })) });
  return <form className="editor-form" onSubmit={async e => { e.preventDefault(); if (!imageBusy && await act('SAVE_QUESTION', draft)) onClose(); }}>
    <label>{t('common.question')}<textarea autoFocus required rows="3" maxLength="400" placeholder={t('question.hint')} value={draft.text} onChange={e => setDraft({ ...draft, text: e.target.value })}/></label>
    <QuestionImageUpload question={draft} onChange={patch => setDraft(current => ({ ...current, ...patch }))} onBusyChange={setImageBusy}/>
    <p className="form-note">{t('question.answerHelp')}</p>
    {draft.answers.map((answer, i) => <div className="answer-editor" key={answer.id}><input type="radio" required name="correctAnswer" aria-label={t('common.markCorrect', { label: ANSWER_LABELS[i] })} checked={draft.correctAnswerId === answer.id} onChange={() => setDraft({ ...draft, correctAnswerId: answer.id })}/><label>{t('common.answerLabel', { label: ANSWER_LABELS[i] })}<input required maxLength="160" value={answer.text} onChange={e => setDraft({ ...draft, answers: draft.answers.map(a => a.id === answer.id ? { ...a, text: e.target.value } : a) })}/></label></div>)}
    <div className="form-actions"><Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button><Button type="submit" disabled={imageBusy}>{question ? t('question.save') : t('question.add')}</Button></div>
  </form>;
}
