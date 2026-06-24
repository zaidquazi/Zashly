import React, { createContext, useContext, useState, useCallback } from 'react';

const MultiSelectContext = createContext(null);

export const MultiSelectProvider = ({ children }) => {
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelection = useCallback((message) => {
    setSelectedMessages((prev) => {
      const isSelected = prev.some((m) => m.id === message.id);
      let newSelection;
      
      if (isSelected) {
        newSelection = prev.filter((m) => m.id !== message.id);
      } else {
        newSelection = [...prev, message];
      }
      
      if (newSelection.length === 0) {
        setIsSelectionMode(false);
      }
      
      return newSelection;
    });
  }, []);

  const startSelection = useCallback((message) => {
    setIsSelectionMode(true);
    setSelectedMessages([message]);
  }, []);

  const clearSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedMessages([]);
  }, []);

  return (
    <MultiSelectContext.Provider
      value={{
        selectedMessages,
        isSelectionMode,
        toggleSelection,
        startSelection,
        clearSelection,
      }}
    >
      {children}
    </MultiSelectContext.Provider>
  );
};

export const useMultiSelect = () => {
  const context = useContext(MultiSelectContext);
  if (!context) {
    throw new Error('useMultiSelect must be used within a MultiSelectProvider');
  }
  return context;
};
