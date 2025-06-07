'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AIConfig } from './types';

// Default AI config
const defaultAIConfig: AIConfig = {
  defaultLanguage: 'id',
  customInstructions: '',
  model: 'qwen/qwen3-32b:free',
  translateLanguage: 'en',
  autoTranslate: false,
};

// Define context type
interface AIContextType {
  aiConfig: AIConfig;
  updateAIConfig: (config: AIConfig) => void;
}

// Create context with default values
const AIContext = createContext<AIContextType>({
  aiConfig: defaultAIConfig,
  updateAIConfig: () => {},
});

// Hook to use AI context
export const useAIConfig = () => useContext(AIContext);

// Provider component
export const AIConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [aiConfig, setAIConfig] = useState<AIConfig>(defaultAIConfig);

  // Load settings from localStorage on first render
  useEffect(() => {
    try {
      const storedConfig = localStorage.getItem('aiConfig');
      if (storedConfig) {
        setAIConfig(JSON.parse(storedConfig));
      }
    } catch (error) {
      console.error('Error loading AI config from localStorage:', error);
    }
  }, []);

  // Update AI config and save to localStorage
  const updateAIConfig = (config: AIConfig) => {
    setAIConfig(config);
    try {
      localStorage.setItem('aiConfig', JSON.stringify(config));
    } catch (error) {
      console.error('Error saving AI config to localStorage:', error);
    }
  };

  return (
    <AIContext.Provider value={{ aiConfig, updateAIConfig }}>
      {children}
    </AIContext.Provider>
  );
}; 