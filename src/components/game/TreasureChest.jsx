export default function TreasureChest({ celebrating = false }) {
  return <g className={`treasure-chest ${celebrating ? 'chest-celebrating' : ''}`}>
    <ellipse className="treasure-glow" cx="27" cy="-8" rx="53" ry="48" fill="#fff29a" opacity="0"/>
    <path className="treasure-rays" d="m12 7-24-64L22-12 30-75 38-12 76-57 48 10Z" fill="#fff5b1" opacity="0"/>
    <rect y="0" width="54" height="34" rx="5" fill="#965437" stroke="#694530" strokeWidth="2"/>
    <ellipse cx="27" cy="3" rx="24" ry="7" fill="#593b30"/>
    <g fill="#ffd265">{[9, 19, 29, 39, 46].map((x, i) => <ellipse key={x} cx={x} cy={3 - i % 2 * 4} rx="6" ry="3"/>)}</g>
    <path d="M9 9v22M44 9v22" stroke="#ffda79" strokeWidth="5"/>
    <g className="chest-lid"><path d="M0 7v-9c0-25 54-25 54 0v9Z" fill="#b57541" stroke="#694530" strokeWidth="2"/>
      <path d="M9-15V6m35-20V6M0 8h54" stroke="#ffd36c" strokeWidth="5"/>
      <rect x="22" y="7" width="11" height="12" rx="2" fill="#ffe193"/><circle cx="27" cy="12" r="2" fill="#784730"/>
    </g>
    <g className="treasure-sparkles" fill="#fff7c6" opacity="0">
      {[[-10, -27], [60, -33], [26, -51]].map(([x, y]) => <path key={x} d={`M${x} ${y - 8}l3 6 7 2-7 3-3 7-3-7-7-3 7-2Z`}/>)}
      <circle cx="4" cy="-48" r="4" fill="#ffd363"/><circle cx="49" cy="-61" r="5" fill="#ffd363"/>
    </g>
  </g>;
}
