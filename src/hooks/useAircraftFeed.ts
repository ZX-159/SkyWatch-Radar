import { useEffect, useRef } from 'react';
import { useAircraftStore } from '../stores/aircraftStore';

export function useAircraftFeed() {
  const startFetching = useAircraftStore(s => s.startFetching);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stopRef.current = startFetching();
    return () => {
      if (stopRef.current) {
        stopRef.current();
        stopRef.current = null;
      }
    };
  }, [startFetching]);
}
