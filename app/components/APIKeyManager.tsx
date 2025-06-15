"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Eye, EyeOff } from 'lucide-react';

interface APIKey {
  id: string;
  provider: string;
  key: string;
  description?: string;
  createdAt: string;
}

const API_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4, ChatGPT API' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude API' },
  { id: 'google', name: 'Google AI', description: 'Gemini, Imagen API' },
  { id: 'browserbase', name: 'Browserbase', description: 'ブラウザ自動化' },
  { id: 'xai', name: 'X.AI Grok', description: 'Grok API' },
  { id: 'brave', name: 'Brave Search', description: 'Web検索API' },
  { id: 'v0', name: 'Vercel V0', description: 'コード生成' },
  { id: 'fal', name: 'Fal.ai', description: 'メディア生成' },
  { id: 'nutrient', name: 'Nutrient', description: '文書処理' },
  { id: 'minimax', name: 'MiniMax', description: '音声合成' },
];

export default function APIKeyManager() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [description, setDescription] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = () => {
    const stored = localStorage.getItem('apiKeys');
    if (stored) {
      setKeys(JSON.parse(stored));
    }
  };

  const saveKey = () => {
    if (!selectedProvider || !apiKey) return;

    const newKey: APIKey = {
      id: Date.now().toString(),
      provider: selectedProvider,
      key: apiKey,
      description,
      createdAt: new Date().toISOString(),
    };

    const updatedKeys = [...keys, newKey];
    setKeys(updatedKeys);
    localStorage.setItem('apiKeys', JSON.stringify(updatedKeys));

    // フォームリセット
    setSelectedProvider('');
    setApiKey('');
    setDescription('');
    setShowForm(false);
  };

  const deleteKey = (id: string) => {
    const updatedKeys = keys.filter(key => key.id !== id);
    setKeys(updatedKeys);
    localStorage.setItem('apiKeys', JSON.stringify(updatedKeys));
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const getProviderName = (providerId: string) => {
    return API_PROVIDERS.find(p => p.id === providerId)?.name || providerId;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          APIキー管理
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            新規追加
          </Button>
        </CardTitle>
        <CardDescription>
          ワークフローで使用するAPIキーを管理できます。データはブラウザのローカルストレージに保存されます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider">プロバイダー</Label>
                  <select
                    id="provider"
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="">プロバイダーを選択</option>
                    {API_PROVIDERS.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name} - {provider.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="apiKey">APIキー</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="APIキーを入力"
                  />
                </div>
                <div>
                  <Label htmlFor="description">説明（オプション）</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="キーの用途など"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveKey} disabled={!selectedProvider || !apiKey}>
                    保存
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    キャンセル
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {keys.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              APIキーが登録されていません
            </p>
          ) : (
            keys.map(key => (
              <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{getProviderName(key.provider)}</Badge>
                    {key.description && (
                      <span className="text-sm text-muted-foreground">
                        {key.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted p-1 rounded">
                      {showKeys[key.id] ? key.key : maskKey(key.key)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKeyVisibility(key.id)}
                    >
                      {showKeys[key.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteKey(key.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}