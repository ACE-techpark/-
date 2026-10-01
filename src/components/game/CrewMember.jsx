export default function CrewMember({ x, y, index = 0, falling = false, location = 'aboard' }) {
  return <g transform={`translate(${x} ${y})`}><g className={falling ? 'crew-fall' : 'crew-idle'} style={{ animationDelay: falling ? '0s' : `${index * -0.35}s` }} data-crew={falling ? 'falling' : location}>
    <path d="M-5 5 -7 16M5 5 7 16" stroke="#243740" strokeWidth="4" strokeLinecap="round"/>
    <rect x="-9" y="-10" width="18" height="23" rx="7" fill={index % 2 ? '#f9f3df' : '#f7b85d'}/>
    <path d="M-8 0H8M-8 6H8" stroke="#d65b50" strokeWidth="3"/>
    <path d="M-10-5 -14 6M10-5l5 10" stroke="#eebc8b" strokeWidth="5" strokeLinecap="round"/>
    <circle cy="-19" r="11" fill={index % 3 === 0 ? '#be8059' : '#ffd0a0'}/>
    <path d="M-11-21q0-15 20-6l3 8-23-2Z" fill={index % 2 ? '#243740' : '#e96559'}/>
    <path d="M-11-21H11" stroke="#ffdb8a" strokeWidth="2"/>
    <circle cx="4" cy="-17" r="1.5" fill="#263442"/><path d="M-9-18 1-16" stroke="#263442" strokeWidth="2"/><circle cx="-4" cy="-17" r="3" fill="#263442"/>
    <path d="M1-11q3 2 5-1" stroke="#7c4b34" strokeWidth="1.5" fill="none"/>
  </g></g>;
}
