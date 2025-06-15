"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import APIKeyManager from '@/app/components/APIKeyManager';
import {
  MessageSquare,
  Users,
  Wrench,
  Image,
  Video,
  Music,
  FileText,
  BookOpen,
  Settings,
  ExternalLink,
  Zap,
  Search,
  Globe,
  Code,
  Presentation,
  Camera,
  Bot
} from 'lucide-react';
import Link from 'next/link';

const MAIN_FEATURES = [
  {
    title: 'AIチャット',
    description: 'メインのAIアシスタント機能',
    icon: MessageSquare,
    href: '/',
    color: 'bg-blue-500',
    featured: true
  },
  {
    title: 'マルチエージェント',
    description: '複数AIエージェントの協働',
    icon: Users,
    href: '/multi-agent',
    color: 'bg-purple-500',
    featured: true
  },
  {
    title: 'ツール一覧',
    description: '20以上のAIツールを確認',
    icon: Wrench,
    href: '/tools',
    color: 'bg-green-500',
    featured: false
  },
  {
    title: 'メディア管理',
    description: '生成した画像・動画・音声を管理',
    icon: Image,
    href: '/media',
    color: 'bg-orange-500',
    featured: false
  }
];

const TOOL_CATEGORIES = [
  {
    title: '情報検索・リサーチ',
    tools: ['Brave Search', 'Grok X検索', 'GitHub Issues'],
    icon: Search,
    color: 'bg-indigo-100 text-indigo-800'
  },
  {
    title: 'コンテンツ生成',
    tools: ['HTMLスライド', 'V0コード生成', 'グラフィックレコーディング'],
    icon: FileText,
    color: 'bg-green-100 text-green-800'
  },
  {
    title: 'メディア生成',
    tools: ['Gemini画像生成', 'Imagen4', 'Gemini動画', 'MiniMax音声'],
    icon: Camera,
    color: 'bg-pink-100 text-pink-800'
  },
  {
    title: 'ブラウザ自動化',
    tools: ['セッション管理', '自動操作', 'スクリーンショット', '情報抽出'],
    icon: Globe,
    color: 'bg-blue-100 text-blue-800'
  }
];

const QUICK_ACTIONS = [
  { title: 'プレゼンテーション作成', icon: Presentation, href: '/?mode=presentation' },
  { title: 'Deep Research', icon: Bot, href: '/?mode=research' },
  { title: 'コード生成', icon: Code, href: '/?mode=code' },
  { title: 'メディア生成', icon: Video, href: '/?mode=media' }
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Open SuperAgent
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            20以上のAIツールを統合した包括的なAIアシスタントプラットフォーム
          </p>
          
          {/* n8nリンク - 目立つ配置 */}
          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 max-w-2xl mx-auto">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="font-bold text-lg">🚀 n8nを安く使う方法</h3>
                  <p className="text-yellow-100">ワークフロー自動化のコストを削減</p>
                </div>
                <Button 
                  asChild
                  variant="secondary"
                  className="bg-white text-orange-600 hover:bg-gray-100"
                >
                  <Link href="https://note.com/jinbago/n/n31c9a5a65e1a" target="_blank">
                    詳細を見る <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* メイン機能 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MAIN_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} href={feature.href}>
                <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer h-full ${
                  feature.featured ? 'ring-2 ring-blue-200' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${feature.color} text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {feature.featured && (
                        <Badge className="bg-blue-500">おすすめ</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* クイックアクション */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              クイックアクション
            </CardTitle>
            <CardDescription>
              よく使用される機能に素早くアクセス
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2 w-full">
                      <Icon className="w-6 h-6" />
                      <span className="text-xs text-center">{action.title}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ツールカテゴリ */}
        <Card>
          <CardHeader>
            <CardTitle>利用可能なツールカテゴリ</CardTitle>
            <CardDescription>
              統合された20以上のAIツールをカテゴリ別に確認
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {TOOL_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.title} className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5" />
                      <h4 className="font-medium">{category.title}</h4>
                    </div>
                    <div className="space-y-1">
                      {category.tools.map((tool) => (
                        <Badge key={tool} variant="secondary" className={`mr-1 mb-1 ${category.color}`}>
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <Link href="/tools">
                  全ツールを確認 <ExternalLink className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* APIキー管理 */}
        <APIKeyManager />

        {/* その他のリンク */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                ユースケース
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                実際の活用事例を確認
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/usecases">
                  事例を見る
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Music className="w-5 h-5 mr-2" />
                生成メディア
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                画像・動画・音声ファイルを管理
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/media">
                  メディア一覧
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                設定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                アプリケーション設定
              </p>
              <Button variant="outline" size="sm" disabled>
                設定画面（開発中）
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* フッター */}
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">
            Open SuperAgent - Powered by Mastra Framework
          </p>
        </div>
      </div>
    </div>
  );
}