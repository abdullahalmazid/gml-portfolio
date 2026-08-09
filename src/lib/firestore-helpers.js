'use client';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { db } from "./firebase";

export function useDoc(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(doc(db, path), (snap) => {
      setData(snap.exists() ? snap.data() : {});
      setLoading(false);
    });
    return () => unsub();
  }, [path]);
  return { data, loading };
}

export function useColl(name, { includeHidden = false } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, name), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Documents flagged hidden never reach the public site. Filtered here
      // rather than in each page, so nothing can leak by being forgotten.
      // The admin reads through useCollection() instead and sees everything.
      setItems(includeHidden ? docs : docs.filter(d => d.hidden !== true));
      setLoading(false);
    });
    return () => unsub();
  }, [name, includeHidden]);
  return { items, loading };
}

/** Show or hide a single document across the whole site. */
export const setHidden = async (name, id, hidden) => {
  return await setDoc(doc(db, name, id), { hidden: Boolean(hidden) }, { merge: true });
};

/** Mark a contact message as read/unread. */
export const setRead = async (id, read = true) => {
  return await setDoc(doc(db, 'messages', id), { read: Boolean(read) }, { merge: true });
};

export const updateData = async (path, data) => {
  return await setDoc(doc(db, path), data, { merge: true });
};

// FIX: Added this helper for Admin Dashboard
export const updateSettings = async (settingId, data) => {
  return await setDoc(doc(db, 'settings', settingId), data, { merge: true });
};

export const addItem = async (name, data) => {
  return await addDoc(collection(db, name), { ...data, createdAt: Date.now() });
};

export const deleteItem = async (name, id) => {
  return await deleteDoc(doc(db, name, id));
};