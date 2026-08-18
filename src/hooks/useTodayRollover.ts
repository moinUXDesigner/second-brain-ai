import { useEffect, useState } from 'react';
import { today } from '@/utils/date';

function msUntilNextLocalMidnight() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);

  return Math.max(0, nextMidnight.getTime() - now.getTime());
}

export function useTodayRollover() {
  const [currentDate, setCurrentDate] = useState(today());

  useEffect(() => {
    let timeoutId: number;

    const refreshDate = () => {
      setCurrentDate(today());
    };

    const scheduleNextMidnight = () => {
      timeoutId = window.setTimeout(() => {
        refreshDate();
        scheduleNextMidnight();
      }, msUntilNextLocalMidnight() + 100);
    };

    const refreshWhenReturning = () => {
      if (document.visibilityState === 'visible') {
        refreshDate();
      }
    };

    scheduleNextMidnight();
    window.addEventListener('focus', refreshDate);
    document.addEventListener('visibilitychange', refreshWhenReturning);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('focus', refreshDate);
      document.removeEventListener('visibilitychange', refreshWhenReturning);
    };
  }, []);

  return currentDate;
}
