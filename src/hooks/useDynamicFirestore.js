'use client';
import { useEffect, useState } from 'react';

export function useDynamicFirestore(collectionName, limitCount = 20) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!collectionName) {
      setIsLoading(false);
      return;
    }

    let isMounted = true; // Prevents state updates if component unmounts

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Dynamically import Firebase only when needed
        const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');

        const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(limitCount));
        const snap = await getDocs(q);
        
        if (isMounted) {
          setData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.error(`Error fetching ${collectionName}:`, err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [collectionName, limitCount]);

  return { data, isLoading, error };
}