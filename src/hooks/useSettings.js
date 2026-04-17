'use client';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useSettings(settingId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!settingId) return;
    
    const unsub = onSnapshot(doc(db, 'settings', settingId), (snap) => {
      setData(snap.exists() ? snap.data() : {});
      setLoading(false);
    });

    return () => unsub();
  }, [settingId]);

  return { data, loading };
}