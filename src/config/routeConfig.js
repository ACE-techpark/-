import { matchPath } from 'react-router-dom';

// Match the same explicit paths as React Router, including case and trailing slashes.
// Neither browser storage nor the public QR origin participates in route selection.
export function getRouteContext(pathname) {
  if (matchPath('/admin', pathname)) return { mode: 'host' };
  for (const mode of ['join', 'team']) {
    const match = matchPath(`/${mode}/:joinToken`, pathname);
    if (match) return { mode, joinToken: match.params.joinToken };
  }
  if (matchPath('/game', pathname) || matchPath('/results', pathname)) return { mode: 'public' };
  return { mode: 'landing' };
}
