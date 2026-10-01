export default function Dolphin({ className = '', style }) {
  return <svg className={`dolphin ${className}`} style={style} viewBox="0 0 240 140" aria-hidden="true">
    <g className="dolphin-leap"><g transform="translate(72 94)">
      <path d="M-27 5q7-28 39-22l11-2 9 5-18 6Q6 11-20 14l-9 10-1-14-14-8Z" fill="#63a6b5" stroke="#367b91" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M-17 8Q2 7 17-9 9 12-17 14Z" fill="#c5eee5"/>
      <path d="M-12-15q-2-15 10-19l4 20M-4 4l-3 16L8 8" fill="#4c8ea7" stroke="#367b91" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="15" cy="-12" r="2.5" fill="#203e4a"/><circle cx="15.5" cy="-13" r=".8" fill="white"/>
      <path d="m20-5 5-2" stroke="#367b91" strokeWidth="1.5" strokeLinecap="round"/>
    </g></g>
    <g className="dolphin-splash" fill="none" stroke="#d6fff6" strokeWidth="2.5" strokeLinecap="round">
      <ellipse cx="166" cy="111" rx="27" ry="5"/><path d="m151 105-6-10m20 8 1-15m12 17 7-11"/>
    </g>
  </svg>;
}
