'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const SiteConfigContext = createContext({ config: {}, loading: true });

// Unified Config: Merges Navbar, Footer, Theme into one object
export function SiteConfigProvider({ children }) {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to a single 'site_config' document for efficiency
    const unsub = onSnapshot(doc(db, 'settings', 'site_config'), (snap) => {
      if (snap.exists()) setConfig(snap.data());
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <SiteConfigContext.Provider value={{ config, loading }}>
      {children}
    </SiteConfigContext.Provider>
  );
}
export const useSiteConfig = () => useContext(SiteConfigContext);
