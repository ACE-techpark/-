import Dolphin from './Dolphin';

// Two bounded SVGs, staggered CSS cycles; no timers or per-frame React updates.
export default function DolphinManager() {
  return <div className="dolphin-manager" aria-hidden="true">
    <Dolphin style={{ left: '24%', top: '18%', '--dolphin-period': '17s', '--dolphin-delay': '-1s' }}/>
    <Dolphin style={{ left: '51%', top: '64%', '--dolphin-period': '23s', '--dolphin-delay': '7s' }}/>
  </div>;
}
