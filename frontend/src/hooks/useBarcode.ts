import { useCallback, useEffect, useRef, useState } from 'react';
import { TIMING } from '@/utils/constants';

interface UseBarcodeResult {
  barcodeId: string | null;
  isLoading: boolean;
  error: string | null;
  timeUntilRefresh: number;
  refresh: () => void;
}

const REFRESH_SECONDS = Math.floor(TIMING.BARCODE_REFRESH_INTERVAL / 1000);

const useBarcode = (
  isAuthenticated: boolean,
  autoRefresh: boolean,
  onSessionExpired: () => Promise<boolean>
): UseBarcodeResult => {
  const [barcodeId, setBarcodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(REFRESH_SECONDS);

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);
  const isReAuthingRef = useRef(false);

  // Store the latest onSessionExpired in a ref so the callback never goes stale
  const onSessionExpiredRef = useRef(onSessionExpired);
  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  // Store fetchBarcode in a ref to allow safe self-reference inside the callback
  const fetchBarcodeRef = useRef<((isRetry?: boolean) => Promise<void>) | null>(null);

  const fetchBarcode = useCallback(async (isRetry = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/barcode', { credentials: 'include' });

      if (res.status === 401) {
        if (!isRetry && !isReAuthingRef.current) {
          isReAuthingRef.current = true;
          const reAuthed = await onSessionExpiredRef.current();
          isReAuthingRef.current = false;
          if (reAuthed) {
            isFetchingRef.current = false;
            // Call via ref to avoid the self-reference lint issue
            await fetchBarcodeRef.current?.(true);
            return;
          }
        }
        isFetchingRef.current = false;
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? 'Unable to load barcode. Please try again.');
        isFetchingRef.current = false;
        setIsLoading(false);
        return;
      }

      const data = (await res.json()) as { barcodeId: string };
      setBarcodeId(data.barcodeId);
      setError(null);
    } catch {
      setError('Network error. Please check your connection.');
    }

    isFetchingRef.current = false;
    setIsLoading(false);
  }, []);

  // Keep the ref in sync with the latest callback
  useEffect(() => {
    fetchBarcodeRef.current = fetchBarcode;
  }, [fetchBarcode]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setTimeout(() => fetchBarcode(), 0);
    return () => clearTimeout(id);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    // Reset countdown via the interval tick, not synchronously in the effect body
    refreshTimerRef.current = setInterval(() => {
      fetchBarcode();
      setTimeUntilRefresh(REFRESH_SECONDS);
    }, TIMING.BARCODE_REFRESH_INTERVAL);

    countdownTimerRef.current = setInterval(() => {
      setTimeUntilRefresh((t) => (t > 0 ? t - 1 : 0));
    }, 1_000);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isAuthenticated, autoRefresh, fetchBarcode]);

  const refresh = useCallback(() => {
    fetchBarcode();

    if (autoRefresh) {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

      setTimeUntilRefresh(REFRESH_SECONDS);

      refreshTimerRef.current = setInterval(() => {
        fetchBarcode();
        setTimeUntilRefresh(REFRESH_SECONDS);
      }, TIMING.BARCODE_REFRESH_INTERVAL);

      countdownTimerRef.current = setInterval(() => {
        setTimeUntilRefresh((t) => (t > 0 ? t - 1 : 0));
      }, 1_000);
    }
  }, [fetchBarcode, autoRefresh]);

  return { barcodeId, isLoading, error, timeUntilRefresh, refresh };
};

export { useBarcode };
