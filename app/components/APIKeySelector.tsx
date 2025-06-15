"use client";

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAPIKeys } from '@/app/hooks/useAPIKeys';
import { ChevronDown, Key, AlertCircle } from 'lucide-react';

interface APIKeySelectorProps {
  provider: string;
  label?: string;
  onKeySelect?: (key: string | null) => void;
  selectedKey?: string | null;
  required?: boolean;
  className?: string;
}

const PROVIDER_NAMES: Record<string, string> = {
  'openai': 'OpenAI',
  'anthropic': 'Anthropic',
  'google': 'Google AI',
  'browserbase': 'Browserbase',
  'xai': 'X.AI Grok',
  'brave': 'Brave Search',
  'v0': 'Vercel V0',
  'fal': 'Fal.ai',
  'nutrient': 'Nutrient',
  'minimax': 'MiniMax',
};

export default function APIKeySelector({
  provider,
  label,
  onKeySelect,
  selectedKey,
  required = false,
  className = ''
}: APIKeySelectorProps) {
  const { getKeysByProvider } = useAPIKeys();
  const [isOpen, setIsOpen] = useState(false);
  
  const availableKeys = getKeysByProvider(provider);
  const providerName = PROVIDER_NAMES[provider] || provider;
  const displayLabel = label || `${providerName} APIキー`;
  
  const handleKeySelect = (key: string | null) => {
    onKeySelect?.(key);
    setIsOpen(false);
  };

  const getSelectedKeyDisplay = () => {
    if (!selectedKey) return 'キーを選択';
    
    const keyObj = availableKeys.find(k => k.key === selectedKey);
    if (keyObj) {
      const maskedKey = keyObj.key.length > 8 
        ? keyObj.key.substring(0, 4) + '*'.repeat(keyObj.key.length - 8) + keyObj.key.substring(keyObj.key.length - 4)
        : keyObj.key;
      return keyObj.description ? `${keyObj.description} (${maskedKey})` : maskedKey;
    }
    
    return 'キーを選択';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium flex items-center gap-2">
        <Key className="w-4 h-4" />
        {displayLabel}
        {required && <span className="text-red-500">*</span>}
      </Label>
      
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
          disabled={availableKeys.length === 0}
        >
          <span className="flex items-center gap-2">
            {availableKeys.length === 0 ? (
              <>
                <AlertCircle className="w-4 h-4 text-orange-500" />
                APIキーが登録されていません
              </>
            ) : (
              getSelectedKeyDisplay()
            )}
          </span>
          <ChevronDown className="w-4 h-4" />
        </Button>
        
        {isOpen && availableKeys.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="py-1">
              {selectedKey && (
                <button
                  onClick={() => handleKeySelect(null)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-gray-500"
                >
                  選択を解除
                </button>
              )}
              {availableKeys.map((keyObj) => {
                const maskedKey = keyObj.key.length > 8 
                  ? keyObj.key.substring(0, 4) + '*'.repeat(keyObj.key.length - 8) + keyObj.key.substring(keyObj.key.length - 4)
                  : keyObj.key;
                
                return (
                  <button
                    key={keyObj.id}
                    onClick={() => handleKeySelect(keyObj.key)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                      selectedKey === keyObj.key ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        {keyObj.description && (
                          <div className="font-medium">{keyObj.description}</div>
                        )}
                        <div className="text-xs text-gray-500 font-mono">
                          {maskedKey}
                        </div>
                      </div>
                      {selectedKey === keyObj.key && (
                        <Badge variant="secondary" className="text-xs">
                          選択中
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {availableKeys.length === 0 && (
        <p className="text-xs text-orange-600">
          {providerName}のAPIキーを先にダッシュボードで登録してください
        </p>
      )}
      
      {required && !selectedKey && availableKeys.length > 0 && (
        <p className="text-xs text-red-600">
          このフィールドは必須です
        </p>
      )}
    </div>
  );
}