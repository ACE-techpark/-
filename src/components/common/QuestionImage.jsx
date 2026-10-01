import { useTranslation } from '../../i18n/useTranslation';
import { useState } from 'react';

function ImagePreview({ src, alt }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  return failed ? <p className="question-image-error" role="status">{t('image.unavailable')}</p>
    : <img className="question-image" src={src} alt={alt || t('image.alt')} onError={() => setFailed(true)}/>;
}

export default function QuestionImage({ question }) {
  const { content } = useTranslation();
  return question.imageUrl ? <ImagePreview key={question.imageUrl} src={question.imageUrl} alt={content(question, 'imageAlt')}/> : null;
}
