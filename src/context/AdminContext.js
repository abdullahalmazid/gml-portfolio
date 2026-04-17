'use client';
import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const AdminContext = createContext({
  editMode: false,
  setEditMode: () => {},
  isAdmin: false,
  editingItem: null,
  setEditingItem: () => {},
  showFieldPaths: false, // NEW
  setShowFieldPaths: () => {}, // NEW
});

export function AdminProvider({ children }) {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showFieldPaths, setShowFieldPaths] = useState(false); // NEW
  
  const isAdmin = !!user;

  return (
    <AdminContext.Provider value={{ 
      editMode: isAdmin && editMode, 
      setEditMode, 
      isAdmin, 
      editingItem, 
      setEditingItem,
      showFieldPaths: isAdmin && showFieldPaths, // NEW
      setShowFieldPaths // NEW
    }}>
      {children}
    </AdminContext.Provider>
  );
}
export const useAdmin = () => useContext(AdminContext);