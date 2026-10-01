import { useTranslation } from '../../i18n/useTranslation';
import TreasureChest from './TreasureChest';
export default function TreasureIsland({ className = '', showChest = true }) {
  const { t } = useTranslation();
  return <svg className={`treasure-island ${className}`} viewBox="0 0 330 340" role="img" aria-label={t('ocean.islandAlt')}>
    <ellipse cx="172" cy="274" rx="153" ry="48" fill="#b8fff1" opacity=".25"/><ellipse cx="172" cy="270" rx="139" ry="39" fill="#ddffef" opacity=".5"/>
    <path d="M41 253q-4-45 61-51 37-32 91-11 54-9 93 34 36 35-15 59-53 26-127 9-87 4-103-40Z" fill="#dfa95e"/>
    <path d="M39 243q1-42 66-49 35-30 88-10 61-7 91 35 25 27-16 49-59 18-129 9-79 5-100-34Z" fill="#f7dc97"/>
    <path d="M77 221q11-42 55-36 42-26 85 3 35 7 43 35-41 30-112 22-49 7-71-24Z" fill="#8bbe68"/>
    <path d="M117 222q15-68-3-121" stroke="#926743" strokeWidth="16" fill="none" strokeLinecap="round"/><path d="m120 184-10-3m11-17-10-3m9-17-11-3m8-18-11-2" stroke="#ba8650" strokeWidth="5"/>
    <path d="M115 106q-53-54-81-2 37-16 75 11-63-10-64 39 34-34 69-33-7-61 24-73-6 23-10 56 45-60 80-25-44-3-75 34 53-27 72 21-37-16-83-15Z" fill="#2e8d61"/>
    <path d="M115 108Q67 86 40 107m78 3 62-29" fill="none" stroke="#64b26e" strokeWidth="4"/>
    <path d="M234 224q-20-57-7-89" stroke="#a47749" strokeWidth="11" fill="none"/>
    <path d="M228 139q-28-42-58-15 33-5 53 25-44-9-43 25 21-20 46-20-10-46 18-57-9 16-10 41 38-38 62-7-32-8-58 17 45-14 46 24-19-21-52-18Z" fill="#489b61"/>
    {showChest && <g transform="translate(155 218) rotate(-8)"><TreasureChest/></g>}
    <g fill="#fff3b2"><path d="m180 181 3 8 8 3-8 3-3 8-3-8-8-3 8-3Zm28 21 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g>
    <path d="M88 253q-10-4-13 2m166-3 10-5" stroke="#dcb677" strokeWidth="3" strokeLinecap="round"/>
  </svg>;
}
