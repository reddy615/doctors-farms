import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../config/api';
import { uniqueDateKeys } from '../utils/dateHelpers';

type BlockedDatesResponse = {
  success?: boolean;
  blockedDates?: string[];
  error?: string;
};

export function useBlockedDates() {
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBlockedDates = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiFetch('/api/blocked-dates', { method: 'GET' });
      const data = (await response.json()) as BlockedDatesResponse;

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Could not load blocked dates');
      }

      setBlockedDates(uniqueDateKeys(Array.isArray(data.blockedDates) ? data.blockedDates : []));
    } catch (fetchError) {
      console.error('Failed to load blocked dates', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Could not load blocked dates');
      setBlockedDates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveBlockedDates = useCallback(async (dates: string[]) => {
    const normalizedDates = uniqueDateKeys(dates);
    const response = await apiFetch('/api/blocked-dates', {
      method: 'PUT',
      body: JSON.stringify({ blockedDates: normalizedDates }),
    });

    const data = (await response.json()) as BlockedDatesResponse;

    if (!response.ok || !data?.success) {
      throw new Error(data?.error || 'Could not save blocked dates');
    }

    setBlockedDates(uniqueDateKeys(Array.isArray(data.blockedDates) ? data.blockedDates : normalizedDates));
    return uniqueDateKeys(Array.isArray(data.blockedDates) ? data.blockedDates : normalizedDates);
  }, []);

  useEffect(() => {
    loadBlockedDates();
  }, [loadBlockedDates]);

  return {
    blockedDates,
    loading,
    error,
    loadBlockedDates,
    saveBlockedDates,
    setBlockedDates,
  };
}
