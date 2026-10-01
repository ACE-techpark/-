const paths = {
  anchor: <><path d="M12 7v14M7 11h10M4 14c0 9 16 9 16 0M4 14l-2 3m18-3 2 3"/><circle cx="12" cy="4" r="3"/></>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5Z"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m2-15a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 4v2"/></>,
  flag: <><path d="M5 22V3c5-5 9 5 15 0v10c-6 5-10-5-15 0"/></>,
  play: <path d="m8 4 13 8-13 8Z"/>,
  screen: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M12 17v4m-5 0h10"/></>,
  trophy: <><path d="M7 3h10v7a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 3v6m-4 0h8"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
  check: <path d="m4 12 5 5L20 6"/>,
  sound: <><path d="m3 9 5 0 5-5v16l-5-5H3Zm14-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/></>,
};
export default function Icon({ name = 'anchor', size = 22, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.anchor}</svg>;
}
