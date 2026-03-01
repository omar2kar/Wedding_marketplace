import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ComparableService {
  id: number | string;
  name: string;
  provider?: string;
  price?: string | number;
  rating?: number;
  distance?: number; // in km
  [key: string]: unknown;
}

interface CompareContextValue {
  items: ComparableService[];
  add: (item: ComparableService) => void;
  remove: (id: ComparableService['id']) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined);

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
};

interface Props { children: ReactNode }
export const CompareProvider: React.FC<Props> = ({ children }) => {
  const [items, setItems] = useState<ComparableService[]>([]);

  const add = (item: ComparableService) => {
    setItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev; // avoid duplicates
      return [...prev, item];
    });
  };

  const remove = (id: ComparableService['id']) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const clear = () => setItems([]);

  return (
    <CompareContext.Provider value={{ items, add, remove, clear }}>
      {children}
    </CompareContext.Provider>
  );
};
