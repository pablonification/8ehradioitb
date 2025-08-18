import { useState, useEffect } from 'react';

export function useOnAirStatus() {
  const [isOnAir, setIsOnAir] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOnAirStatus = async () => {
      try {
        const response = await fetch('/api/stream-config');
        if (!response.ok) {
          throw new Error('Failed to fetch stream config');
        }
        const data = await response.json();
        setIsOnAir(data?.onAir || false);
      } catch (err) {
        console.error('Error fetching on-air status:', err);
        setError(err.message);
        // Default to false if there's an error
        setIsOnAir(false);
      } finally {
        setLoading(false);
      }
    };

    fetchOnAirStatus();
  }, []);

  return { isOnAir, loading, error };
}
