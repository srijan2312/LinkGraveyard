// hooks/useCheckAll.js
// Runs the "Check all links" flow: the backend checks each URL and returns
// fresh statuses. We send ids in small batches so the UI can show real
// progress ("Checking 12 / 40") instead of one silent long request.
// The button stays disabled while checking, which prevents double clicks.

import { useState } from 'react';
import api from '../services/api';

const BATCH_SIZE = 10;

export function useCheckAll() {
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total } | null

  async function run(ids, { onBatch } = {}) {
    if (checking || ids.length === 0) return [];

    setChecking(true);
    setProgress({ done: 0, total: ids.length });
    const results = [];

    try {
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const { data } = await api.post('/links/check-all', { ids: batch });
        results.push(...data.results);
        setProgress({ done: Math.min(i + BATCH_SIZE, ids.length), total: ids.length });
        if (onBatch) onBatch(data.results);
      }
    } finally {
      // Always reset, even if a batch failed — no stuck loading states.
      setChecking(false);
      setProgress(null);
    }

    return results;
  }

  return { checking, progress, run };
}
