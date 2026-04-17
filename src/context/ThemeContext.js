'use client';
import { db } from '@/lib/firebase';
import { applyThemeColors } from '@/lib/themes';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ 
  theme: 'warm-sand', 
  setTheme: () => {},
  customColors: null,
  setCustomColors: () => {} 
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('warm-sand');
  const [customColors, setCustomColorsState] = useState(null);

  // 1. Listen to Firestore for theme changes
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.theme) setThemeState(data.theme);
        if (data.customColors) setCustomColorsState(data.customColors);
      }
    });
    return () => unsub();
  }, []);

  // 2. Apply CSS Variables whenever theme or customColors change
  useEffect(() => {
    const apply = async () => {
      const { getThemeById } = await import('@/lib/themes');
      
      if (theme === 'custom' && customColors) {
        applyThemeColors(customColors);
      } else {
        const preset = getThemeById(theme);
        applyThemeColors(preset.colors);
      }
    };
    apply();
  }, [theme, customColors]);

  // 3. Function to update Theme ID
  const setTheme = useCallback(async (newThemeId) => {
    setThemeState(newThemeId);
    try {
      await setDoc(doc(db, 'settings', 'site_config'), { theme: newThemeId }, { merge: true });
    } catch (e) { console.error("Theme save error", e); }
  }, []);

  // 4. Function to update Custom Colors
  const setCustomColors = useCallback(async (colors) => {
    setCustomColorsState(colors);
    setThemeState('custom'); // Switch to custom mode
    try {
      await setDoc(doc(db, 'settings', 'site_config'), { 
        theme: 'custom', 
        customColors: colors 
      }, { merge: true });
    } catch (e) { console.error("Custom theme save error", e); }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customColors, setCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);