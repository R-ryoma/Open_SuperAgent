"use client";

import { useState, useEffect } from 'react';

interface APIKey {
  id: string;
  provider: string;
  key: string;
  description?: string;
  createdAt: string;
}

export function useAPIKeys() {
  const [keys, setKeys] = useState<APIKey[]>([]);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('apiKeys');
      if (stored) {
        try {
          setKeys(JSON.parse(stored));
        } catch (error) {
          console.error('Failed to load API keys:', error);
          setKeys([]);
        }
      }
    }
  };

  const getKeysByProvider = (provider: string): APIKey[] => {
    return keys.filter(key => key.provider === provider);
  };

  const getKeyByProvider = (provider: string): string | null => {
    const providerKeys = getKeysByProvider(provider);
    return providerKeys.length > 0 ? providerKeys[0].key : null;
  };

  const getAllProviders = (): string[] => {
    return [...new Set(keys.map(key => key.provider))];
  };

  const addKey = (provider: string, key: string, description?: string): void => {
    const newKey: APIKey = {
      id: Date.now().toString(),
      provider,
      key,
      description,
      createdAt: new Date().toISOString(),
    };

    const updatedKeys = [...keys, newKey];
    setKeys(updatedKeys);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('apiKeys', JSON.stringify(updatedKeys));
    }
  };

  const removeKey = (id: string): void => {
    const updatedKeys = keys.filter(key => key.id !== id);
    setKeys(updatedKeys);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('apiKeys', JSON.stringify(updatedKeys));
    }
  };

  const updateKey = (id: string, updates: Partial<APIKey>): void => {
    const updatedKeys = keys.map(key => 
      key.id === id ? { ...key, ...updates } : key
    );
    setKeys(updatedKeys);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('apiKeys', JSON.stringify(updatedKeys));
    }
  };

  return {
    keys,
    getKeysByProvider,
    getKeyByProvider,
    getAllProviders,
    addKey,
    removeKey,
    updateKey,
    reload: loadKeys
  };
}