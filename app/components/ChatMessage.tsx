'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import type { Message } from 'ai';
import { ChevronDownIcon, ChevronUpIcon, CogIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { PuzzlePieceIcon } from '@heroicons/react/24/outline';
import { PresentationPreviewPanel } from './PresentationPreviewPanel';
import { ImagePreviewPanel } from './ImagePreviewPanel';
import { BrowserOperationSidebar } from './BrowserOperationSidebar';
import { EyeIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';

// 拡張メッセージパートの型
type MessageContentPart = {
  type: string;
  text?: string;
};

// AIメッセージの拡張された型（ツール呼び出しなどの情報を含む）
interface ExtendedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'data';
  content: string | MessageContentPart[];
  createdAt?: Date;
  tool_name?: string;
  tool_calls?: Array<{
    toolCallId: string;
    toolName: string;
    args: any;
  }>;
  tool_results?: Array<{
    toolCallId: string;
    result: any;
    isError?: boolean;
    autoOpen?: boolean;
  }>;
  toolInvocations?: Array<any>;
  parts?: Array<{
    type: string;
    text?: string;
    toolInvocation?: {
      toolCallId: string;
      toolName: string;
      args?: any;
      state?: string;
      result?: any;
    };
  }>;
}

// ツール呼び出しの状態を管理するための型
interface ToolCallState {
  id: string;
  toolName: string;
  args: object;
  result?: any;
  status: 'pending' | 'running' | 'success' | 'error'; // 実行中、成功、エラー
  isExpanded: boolean;
}

// プレゼンテーションプレビュー状態
interface PresentationPreviewState {
  isOpen: boolean;
  htmlContent: string;
  title: string;
}

// 画像プレビュー状態
interface ImagePreviewState {
  isOpen: boolean;
  images: Array<{
    url: string;
    b64Json: string;
  }>;
  title: string;
}

// Browserbaseプレビュー状態
interface BrowserbasePreviewState {
  isOpen: boolean;
  sessionId: string;
  replayUrl: string;
  liveViewUrl?: string;
  pageTitle?: string;
  title: string;
}

interface ChatMessageProps {
  message: ExtendedMessage;
  onPreviewOpen?: () => void; // プレビューが開かれたときのコールバック
  onPreviewClose?: () => void; // プレビューが閉じられたときのコールバック
  onPreviewWidthChange?: (width: number) => void; // プレビューパネルの幅が変更されたときのコールバック
  onBrowserbasePreview?: (data: {
    sessionId: string;
    replayUrl: string;
    liveViewUrl?: string;
    pageTitle?: string;
  }) => void; // Browserbaseプレビューが開かれたときのコールバック
  onBrowserAutomationDetected?: (data: {
    sessionId: string;
    replayUrl: string;
    liveViewUrl?: string;
    pageTitle?: string;
    elementText?: string;
  }) => void; // Browser Automation Tool実行検知時のコールバック
}

// 折りたたみ可能なツールセクションコンポーネント
const CollapsibleToolSection = ({
  toolName,
  toolState,
  children,
  isLoading,
  isPreviewTool = false,
  isImageTool = false,
  isBrowserbaseTool = false,
  onPreviewClick = () => {},
  onImageClick = () => {},
  onBrowserbaseClick = () => {},
  previewHtml = '',
  imageUrls = [],
  browserbaseData = null,
}: {
  toolName: string;
  toolState: 'call' | 'partial-call' | 'result' | string;
  children: React.ReactNode;
  isLoading: boolean;
  isPreviewTool?: boolean;
  isImageTool?: boolean;
  isBrowserbaseTool?: boolean;
  onPreviewClick?: () => void;
  onImageClick?: () => void;
  onBrowserbaseClick?: () => void;
  previewHtml?: string;
  imageUrls?: string[];
  browserbaseData?: {
    sessionId: string;
    replayUrl: string;
    liveViewUrl?: string;
    pageTitle?: string;
  } | null;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // ツールの状態に応じた背景色クラスを設定
  const getBgColorClass = () => {
    switch (toolState) {
      case 'call':
      case 'partial-call':
      case 'running':
        return isLoading 
          ? 'bg-gray-100 border-gray-200' 
          : 'bg-[rgb(245,245,245)] border-[rgb(245,245,245)]';
      case 'result':
      case 'success':
        return 'bg-gray-50 border-gray-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-[rgb(245,245,245)] border-[rgb(245,245,245)]';
    }
  };

  // ツールアイコンの色を状態に応じて設定
  const getIconColorClass = () => {
    switch (toolState) {
      case 'call':
      case 'partial-call':
      case 'running':
        return 'text-gray-600';
      case 'result':
      case 'success':
        return 'text-gray-700';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // ツールの状態に応じたアイコンを表示
  const getStateIcon = () => {
    switch (toolState) {
      case 'call':
      case 'partial-call':
      case 'running':
        return isLoading ? <CogIcon className="h-4 w-4 animate-spin" /> : <PuzzlePieceIcon className="h-4 w-4" />;
      case 'result':
      case 'success':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'error':
        return <ExclamationCircleIcon className="h-4 w-4" />;
      default:
        return <PuzzlePieceIcon className="h-4 w-4" />;
    }
  };

  const handleHeaderClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`rounded-lg border ${getBgColorClass()} overflow-hidden transition-colors duration-200 mb-3 shadow-sm`}>
      <div className="flex items-center justify-between px-3 py-2">
        <div 
          className="flex items-center space-x-2 cursor-pointer select-none hover:bg-gray-200/50 transition-colors flex-grow rounded px-2 py-1"
          onClick={handleHeaderClick}
        >
          <div className={`flex items-center justify-center h-5 w-5 ${getIconColorClass()}`}>
            {getStateIcon()}
          </div>
          <span className="font-medium text-sm flex items-center">
            {toolName === 'geminiImageGenerationTool' ? 'Gemini画像生成' : 
             toolName === 'gemini-image-generation' ? 'Gemini画像生成' : 
             toolName === 'imagen4-generation' ? 'Imagen 4画像生成' :
             toolName === 'htmlSlideTool' ? 'HTMLスライド生成' : 
             toolName === 'graphicRecordingTool' ? 'グラフィックレコーディング' :
             toolName === 'browserbase-automation' ? 'ブラウザ自動化' :
             toolName === 'browser-automation-tool' ? 'ブラウザ自動化' :
             toolName}
            {(isLoading && (toolState === 'running' || toolState === 'call')) && (
              <span className="ml-2 inline-block text-gray-600 text-xs font-normal animate-pulse">処理中...</span>
            )}
            {toolState === 'error' && (
              <span className="ml-2 text-red-500 text-xs font-normal">(エラー)</span>
            )}
            {(toolState === 'success' || toolState === 'result') && (
              <span className="ml-2 text-gray-600 text-xs font-normal">(完了)</span>
            )}
          </span>
        </div>

        <div className="flex items-center">
          {/* プレビューツールの場合はプレビューボタンを表示 */}
          {isPreviewTool && (toolState === 'success' || toolState === 'result') && previewHtml && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPreviewClick();
              }}
              className="mr-2 px-3 py-1 bg-gray-800 text-white rounded-md text-xs flex items-center hover:bg-gray-700 transition-colors"
              title="スライドをプレビュー表示"
            >
              <EyeIcon className="h-3 w-3 mr-1" />
              <span>プレビュー</span>
            </button>
          )}
          
          {/* 画像ツールの場合は画像プレビューボタンを表示 */}
          {isImageTool && (toolState === 'success' || toolState === 'result') && imageUrls && imageUrls.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onImageClick();
              }}
              className="mr-2 px-3 py-1 bg-gray-800 text-white rounded-md text-xs flex items-center hover:bg-gray-700 transition-colors"
              title="生成された画像をプレビュー表示"
            >
              <PhotoIcon className="h-3 w-3 mr-1" />
              <span>プレビュー</span>
            </button>
          )}
          
          {/* Browserbaseツールの場合はBrowserbaseプレビューボタンを表示 */}
          {isBrowserbaseTool && browserbaseData && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBrowserbaseClick();
              }}
              className="mr-2 px-3 py-1 bg-gray-800 text-white rounded-md text-xs flex items-center hover:bg-gray-700 transition-colors"
              title="Browserbase操作画面を表示"
            >
              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>プレビュー</span>
            </button>
          )}
          
          <button 
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-200/50"
            aria-label={isExpanded ? "折りたたむ" : "展開する"}
            onClick={handleHeaderClick}
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3 pt-0">
          {children}
        </div>
      )}
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onPreviewOpen, onPreviewClose, onPreviewWidthChange, onBrowserbasePreview, onBrowserAutomationDetected }) => {
  // デバッグモード（ノンプロダクション環境のみ）
  const DEBUG_MODE = process.env.NODE_ENV !== 'production';
  const [isLoading, setIsLoading] = useState(false);
  
  // プレゼンテーションプレビュー状態
  const [presentationPreview, setPresentationPreview] = useState<PresentationPreviewState>({
    isOpen: false,
    htmlContent: '',
    title: 'プレゼンテーションプレビュー'
  });
  
  // 画像プレビュー状態
  const [imagePreview, setImagePreview] = useState<ImagePreviewState>({
    isOpen: false,
    images: [],
    title: '生成された画像'
  });
  
  // 画像ツールの情報を保持
  const [imageTool, setImageTool] = useState<{
    [key: string]: {
      images: Array<{
        url: string;
        b64Json: string;
      }>;
      title: string;
    }
  }>({});
  
  // Browserbaseツールの情報を保持
  const [browserbaseTool, setBrowserbaseTool] = useState<{
    [key: string]: {
      sessionId: string;
      replayUrl: string;
      liveViewUrl?: string;
      pageTitle?: string;
      title: string;
    }
  }>({});
  
  // プレゼンテーションツールの情報を保持
  const [presentationTools, setPresentationTools] = useState<{
    [key: string]: {
      htmlContent: string;
      title: string;
    }
  }>({});
  
  // デバッグ情報を表示
  useEffect(() => {
    if (DEBUG_MODE && (message as any).role === 'tool') {
      console.log('Tool message detected:', message);
    }
  }, [message, DEBUG_MODE]);

  const [toolCallStates, setToolCallStates] = useState<Record<string, ToolCallState>>({});

  // ツールメッセージの処理
  useEffect(() => {
    if (message.role === 'assistant') {
      // ローディング状態の検出
      const inProgress = message.id.startsWith('loading-');
      setIsLoading(inProgress);
      
      // ツール呼び出しの処理
      if (message.tool_calls && message.tool_calls.length > 0) {
        setToolCallStates(prevStates => {
          const newStates = { ...prevStates };
          message.tool_calls?.forEach(tc => {
            const existingState = prevStates[tc.toolCallId];
                          // 特定のツールタイプの場合は、デフォルトで展開表示
              const shouldExpandByDefault = 
                tc.toolName === 'gemini-image-generation' || 
                tc.toolName === 'geminiImageGenerationTool' || 
                tc.toolName === 'imagen4-generation';
                
              newStates[tc.toolCallId] = {
                id: tc.toolCallId,
                toolName: tc.toolName,
                args: tc.args,
                result: existingState?.result, // Keep existing result if any
                status: existingState?.result 
                  ? (existingState.status === 'error' ? 'error' : 'success') 
                  : 'running', // If result exists, it's success/error, else running
                isExpanded: existingState?.isExpanded !== undefined ? existingState.isExpanded : shouldExpandByDefault,
              };
            
            // presentationPreviewToolのデータを保存（ただし自動表示はしない）
            if (tc.toolName === 'presentationPreviewTool' && tc.args.htmlContent) {
              setPresentationTools(prev => ({
                ...prev,
                [tc.toolCallId]: {
                  htmlContent: tc.args.htmlContent as string,
                  title: (tc.args.title as string) || 'プレゼンテーションプレビュー'
                }
              }));
            }
            
            // 🔧 **browser-automation-toolの即座表示**
            if ((tc.toolName === 'browser-automation-tool' || tc.toolName === 'browserbase-automation') && tc.args) {
              // ツール実行開始時点でBrowserbaseToolデータを準備
              setBrowserbaseTool(prev => ({
                ...prev,
                [tc.toolCallId]: {
                  sessionId: 'loading-' + tc.toolCallId, // ローディング状態のセッションID
                  replayUrl: '#loading',
                  liveViewUrl: '#loading',
                  pageTitle: `ブラウザ自動化実行中: ${(tc.args as any).task?.substring(0, 50) || 'タスク実行中'}...`,
                  title: 'ブラウザ自動化'
                }
              }));
              
              // 親コンポーネントに即座に通知
              if (onBrowserAutomationDetected) {
                onBrowserAutomationDetected({
                  sessionId: 'loading-' + tc.toolCallId,
                  replayUrl: '#loading',
                  liveViewUrl: '#loading',
                  pageTitle: `ブラウザ自動化実行中: ${(tc.args as any).task?.substring(0, 50) || 'タスク実行中'}...`,
                  elementText: 'ツール実行開始'
                });
              }
            }
          });
          return newStates;
        });
      }
      
      // ツール結果の処理
      if (message.tool_results && message.tool_results.length > 0) {
        setToolCallStates(prevStates => {
          const updatedStates = { ...prevStates };
          message.tool_results?.forEach(tr => {
            if (updatedStates[tr.toolCallId]) {
              // 特定のツールタイプの場合は、デフォルトで展開表示
              const shouldExpandByDefault = 
                updatedStates[tr.toolCallId].toolName === 'gemini-image-generation' || 
                updatedStates[tr.toolCallId].toolName === 'geminiImageGenerationTool' || 
                updatedStates[tr.toolCallId].toolName === 'imagen4-generation';
              
              updatedStates[tr.toolCallId] = {
                ...updatedStates[tr.toolCallId],
                result: tr.result,
                status: tr.isError ? 'error' : 'success',
                isExpanded: shouldExpandByDefault || updatedStates[tr.toolCallId].isExpanded,
              };
              // presentationPreviewToolの結果データを保存（ただし自動表示はしない）
              const toolState = updatedStates[tr.toolCallId];
              if ((toolState.toolName === 'presentationPreviewTool' || toolState.toolName === 'htmlSlideTool') && tr.result?.htmlContent) {
                setPresentationTools(prev => ({
                  ...prev,
                  [tr.toolCallId]: {
                    htmlContent: tr.result.htmlContent,
                    title: tr.result.title || 'プレゼンテーションプレビュー'
                  }
                }));
                // autoOpen: true なら自動でプレビューパネルを開く
                if (tr.result.autoOpen) {
                  setPresentationPreview({
                    isOpen: true,
                    htmlContent: tr.result.htmlContent,
                    title: tr.result.title || 'プレゼンテーションプレビュー'
                  });
                }
              }
              
              // グラフィックレコーディングツールの結果データを保存
              if (toolState.toolName === 'graphicRecordingTool' && tr.result?.htmlContent) {
                setPresentationTools(prev => ({
                  ...prev,
                  [tr.toolCallId]: {
                    htmlContent: tr.result.htmlContent,
                    title: tr.result.title || tr.result.previewData?.title || 'グラフィックレコーディング'
                  }
                }));
                // autoPreview: true なら自動でプレビューパネルを開く
                if (tr.result.autoPreview) {
                  setPresentationPreview({
                    isOpen: true,
                    htmlContent: tr.result.htmlContent,
                    title: tr.result.title || tr.result.previewData?.title || 'グラフィックレコーディング'
                  });
                  // 親コンポーネントに通知
                  onPreviewOpen?.();
                }
              }
              
              // 動画生成ツールの結果データを保存
              if ((toolState.toolName === 'veo2-video-generation' || toolState.toolName === 'gemini-video-generation') && tr.result?.videos && tr.result.videos.length > 0) {
                // 動画データの処理は後で追加
              }
              
              // 画像生成ツールの結果データを保存
              if ((toolState.toolName === 'gemini-image-generation' || toolState.toolName === 'geminiImageGenerationTool' || toolState.toolName === 'imagen4-generation') && tr.result?.images && tr.result.images.length > 0) {
                setImageTool(prev => ({
                  ...prev,
                  [tr.toolCallId]: {
                    images: tr.result.images,
                    title: tr.result.title || `生成された画像（${tr.result.images.length}枚）`
                  }
                }));
                
                // autoOpenPreviewが設定されていれば自動的に画像プレビューを開く
                if (tr.result.autoOpenPreview) {
                  setImagePreview({
                    isOpen: true,
                    images: tr.result.images,
                    title: tr.result.title || `生成された画像（${tr.result.images.length}枚）`
                  });
                }
              }
              
              // Browserbaseツールの結果データを保存
              if ((toolState.toolName === 'browserbase-automation' || toolState.toolName === 'browser-automation-tool') && tr.result?.sessionId) {
                setBrowserbaseTool(prev => ({
                  ...prev,
                  [tr.toolCallId]: {
                    sessionId: tr.result.sessionId,
                    replayUrl: tr.result.replayUrl,
                    liveViewUrl: tr.result.liveViewUrl,
                    pageTitle: tr.result.pageTitle || 'ブラウザ自動化セッション',
                    title: tr.result.pageTitle || 'ブラウザ自動化セッション'
                  }
                }));
                
                // autoOpenPreviewが設定されていれば自動的にBrowserbaseプレビューを開く
                if (tr.result.autoOpenPreview && onBrowserbasePreview) {
                  onBrowserbasePreview({
                    sessionId: tr.result.sessionId,
                    replayUrl: tr.result.replayUrl,
                    liveViewUrl: tr.result.liveViewUrl,
                    pageTitle: tr.result.pageTitle
                  });
                }
              }
            }
          });
          return updatedStates;
        });
      }
      
      // tool_invocationを持つメッセージのパーツから情報を抽出
      if (message.parts && message.parts.length > 0) {
        setToolCallStates(prev => {
          const updatedStates = { ...prev };
          message.parts?.forEach(part => {
            if (part.type === 'tool-invocation' && part.toolInvocation) {
              const { toolCallId, toolName, args, state } = part.toolInvocation;
              
              if (toolCallId && toolName) {
                let result: any = undefined;
                let status: ToolCallState['status'] = 'pending';
                
                if (state === 'result') {
                  result = (part.toolInvocation as any).result;
                  status = 'success';
                } else if (state === 'call' || state === 'partial-call') {
                  status = 'running';
                }
                
                updatedStates[toolCallId] = {
                  ...updatedStates[toolCallId],
                  id: toolCallId,
                  toolName,
                  args: args || {},
                  result,
                  status,
                  isExpanded: updatedStates[toolCallId]?.isExpanded || false,
                };
                
                // presentationPreviewToolのデータを保存（ただし自動表示はしない）
                if (toolName === 'presentationPreviewTool') {
                  if (args && (args as any).htmlContent) {
                    setPresentationTools(prev => ({
                      ...prev,
                      [toolCallId]: {
                        htmlContent: (args as any).htmlContent,
                        title: (args as any).title || 'プレゼンテーションプレビュー'
                      }
                    }));
                  }
                  
                  // 結果が既に存在する場合
                  if (state === 'result' && result && result.htmlContent) {
                    setPresentationTools(prev => ({
                      ...prev,
                      [toolCallId]: {
                        htmlContent: result.htmlContent,
                        title: result.title || 'プレゼンテーションプレビュー'
                      }
                    }));
                  }
                }
              }
            }
          });
          return updatedStates;
        });
      }
      
      // toolInvocationsから情報を抽出（代替フォーマット）
      if (message.toolInvocations && message.toolInvocations.length > 0) {
        setToolCallStates(prev => {
          const updatedStates = { ...prev };
          message.toolInvocations?.forEach(inv => {
            const genericInv = inv as any;
            const toolName = genericInv.toolName || (genericInv.function ? genericInv.function.name : 'unknown_tool');
            const toolCallId = genericInv.toolCallId || genericInv.id || `fallback-id-${Math.random()}`;
            const args = genericInv.args || (genericInv.function ? genericInv.function.arguments : undefined);
            const state = genericInv.state;
            const result = genericInv.result;
            
            let status: ToolCallState['status'] = 'pending';
            if (state === 'result') {
              status = 'success';
            } else if (state === 'call') {
              status = 'running';
            } else if (result) {
              status = 'success';
            }
            
            updatedStates[toolCallId] = {
              ...updatedStates[toolCallId],
              id: toolCallId,
              toolName,
              args: args || {},
              result,
              status,
              isExpanded: updatedStates[toolCallId]?.isExpanded || false,
            };
            
            // presentationPreviewToolのデータを保存（ただし自動表示はしない）
            if (toolName === 'presentationPreviewTool') {
              // 引数からHTMLコンテンツを取得
              if (args && args.htmlContent) {
                setPresentationTools(prev => ({
                  ...prev,
                  [toolCallId]: {
                    htmlContent: args.htmlContent,
                    title: args.title || 'プレゼンテーションプレビュー'
                  }
                }));
              }
              
              // 結果からHTMLコンテンツを取得
              if (result && result.htmlContent) {
                setPresentationTools(prev => ({
                  ...prev,
                  [toolCallId]: {
                    htmlContent: result.htmlContent,
                    title: result.title || 'プレゼンテーションプレビュー'
                  }
                }));
              }
            }
          });
          return updatedStates;
        });
      }
    }
  }, [message]);

  // Browser Automation Tool実行検知
  useEffect(() => {
    // ツール実行の検知（toolInvocationsから）
    if ((message as any).toolInvocations && Array.isArray((message as any).toolInvocations)) {
      for (const invocation of (message as any).toolInvocations) {
        if (invocation.toolName === 'browser-automation-tool' && invocation.result && onBrowserAutomationDetected) {
          const result = invocation.result;
          console.log('[ChatMessage] Browser Automation Tool result detected:', result);
          
          onBrowserAutomationDetected({
            sessionId: result.sessionId || `session-${Date.now()}`,
            replayUrl: result.replayUrl || '#no-replay',
            liveViewUrl: result.liveViewUrl,
            pageTitle: result.pageTitle || 'ブラウザ自動化実行結果',
            elementText: result.result || 'ブラウザ自動化が完了しました'
          });
          break; // 一度検知したら終了
        }
      }
    }

    // ツール実行の検知（partsから）
    if (message.parts && message.parts.length > 0) {
      for (const part of message.parts) {
        if (part.type === 'tool-invocation' && part.toolInvocation) {
          const { toolName, result } = part.toolInvocation;
          if (toolName === 'browser-automation-tool' && result && onBrowserAutomationDetected) {
            console.log('[ChatMessage] Browser Automation Tool result detected from parts:', result);
            
            onBrowserAutomationDetected({
              sessionId: result.sessionId || `session-${Date.now()}`,
              replayUrl: result.replayUrl || '#no-replay',
              liveViewUrl: result.liveViewUrl,
              pageTitle: result.pageTitle || 'ブラウザ自動化実行結果',
              elementText: result.result || 'ブラウザ自動化が完了しました'
            });
            break; // 一度検知したら終了
          }
        }
      }
    }

    // ツール結果の検知（tool_resultsから）
    if (message.tool_results && message.tool_results.length > 0) {
      for (const toolResult of message.tool_results) {
        // ツール名を特定するために対応するtool_callを探す
        const correspondingCall = message.tool_calls?.find(call => call.toolCallId === toolResult.toolCallId);
        
        if (correspondingCall?.toolName === 'browser-automation-tool' && toolResult.result && onBrowserAutomationDetected) {
          const result = toolResult.result;
          console.log('[ChatMessage] Browser Automation Tool result detected from tool_results:', result);
          
          onBrowserAutomationDetected({
            sessionId: result.sessionId || `session-${Date.now()}`,
            replayUrl: result.replayUrl || '#no-replay',
            liveViewUrl: result.liveViewUrl,
            pageTitle: result.pageTitle || 'ブラウザ自動化実行結果',
            elementText: result.result || 'ブラウザ自動化が完了しました'
          });
          break; // 一度検知したら終了
        }
      }
    }

    // メッセージ内容からの検知（フォールバック）
    if (message.role === 'assistant' && message.content && typeof message.content === 'string') {
      const content = message.content;
      
      // Browser Automation Tool関連のキーワードを検知
      const browserAutomationKeywords = [
        'browser-automation-tool',
        'ブラウザ自動化実行結果',
        'Browser Automation Tool',
        'セッションID:',
        'Session ID:',
        'browserbase-'
      ];
      
      const containsBrowserAutomation = browserAutomationKeywords.some(keyword => 
        content.includes(keyword)
      );
      
      if (containsBrowserAutomation && onBrowserAutomationDetected) {
        console.log('[ChatMessage] Browser Automation Tool detected from content');
        
        // セッション情報を抽出
        const sessionIdMatch = content.match(/(?:セッション|Session)\s*ID[:\s]*([a-f0-9-]{8,})/i) ||
                              content.match(/browserbase-(\d+)/i);
        const replayUrlMatch = content.match(/(https:\/\/[^\s)]+)/);
        
        onBrowserAutomationDetected({
          sessionId: sessionIdMatch ? sessionIdMatch[1] : `content-${Date.now()}`,
          replayUrl: replayUrlMatch ? replayUrlMatch[1] : '#content-detected',
          liveViewUrl: undefined,
          pageTitle: 'ブラウザ自動化実行結果',
          elementText: 'メッセージ内容から検知されました'
        });
      }
    }
  }, [message, onBrowserAutomationDetected]);

  const toggleSection = (id: string) => {
    setToolCallStates(prev => ({
      ...prev,
      [id]: { ...prev[id], isExpanded: !prev[id]?.isExpanded }
    }));
  };
  
  // プレゼンテーションプレビューパネルを開く
  const openPreviewPanel = (htmlContent: string, title: string) => {
    setPresentationPreview({
      isOpen: true,
      htmlContent,
      title
    });
    onPreviewOpen?.(); // 親コンポーネントに通知
  };
  
  // プレゼンテーションプレビューパネルを閉じる
  const closePreviewPanel = () => {
    setPresentationPreview(prev => ({
      ...prev,
      isOpen: false
    }));
    onPreviewClose?.(); // 親コンポーネントに通知
  };

  // 画像プレビューパネルを開く
  const openImagePreviewPanel = (images: Array<{url: string; b64Json: string}>, title: string) => {
    setImagePreview({
      isOpen: true,
      images,
      title
    });
    
    // 親コンポーネントに通知（必要な場合）
    onPreviewOpen?.();
  };
  
  // 画像プレビューパネルを閉じる
  const closeImagePreviewPanel = () => {
    setImagePreview(prev => ({
      ...prev,
      isOpen: false
    }));
    
    // 親コンポーネントに通知（必要な場合）
    onPreviewClose?.();
  };

  // プレゼンテーションプレビューパネルの幅が変更されたときの処理
  const handlePreviewPanelWidthChange = (width: number) => {
    onPreviewWidthChange?.(width); // 親コンポーネントに通知
  };

  // マークダウンの画像・動画リンクを検出してメディア要素に変換する関数
  const renderMarkdownMedia = (text: string): ReactNode[] => {
    // 画像記法 ![alt](url) と画像URLを含む通常のリンク記法 [text](media-url) の両方に対応
    const mediaRegex = /(!?)\[([^\]]*)\]\(([^)]+)\)/g;
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mediaRegex.exec(text)) !== null) {
      const [fullMatch, exclamationMark, altText, rawMediaUrl] = match;
      
      // メディアURLの前処理
      let mediaUrl = rawMediaUrl;
      
      // sandbox:プレフィックスを除去（環境に応じて調整）
      if (rawMediaUrl.startsWith('sandbox:')) {
        mediaUrl = rawMediaUrl.replace('sandbox:', '');
        console.log('Removed sandbox: prefix, new URL:', mediaUrl);
      }
      
      // ローカルパス（/generated-で始まる）の場合の処理
      if (mediaUrl.startsWith('/generated-')) {
        console.log('Local generated media path detected:', mediaUrl);
      }
      
      // メディアURLかどうかを判定（画像、動画、音声の全てに対応）
      const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(mediaUrl) ||
                        mediaUrl.includes('/generated-images/') ||
                        rawMediaUrl.startsWith('sandbox:');
      
      const isVideoUrl = /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(mediaUrl) ||
                        mediaUrl.includes('/generated-videos/');
      
      const isAudioUrl = /\.(mp3|wav|ogg|m4a|aac|flac)(\?|$)/i.test(mediaUrl) ||
                        mediaUrl.includes('/generated-music/');
      
      // 感嘆符がある場合のみメディアとして処理
      const isMarkdownMedia = exclamationMark === '!' && (isImageUrl || isVideoUrl || isAudioUrl);
      
      console.log('Markdown link detected:', {
        fullMatch,
        exclamationMark,
        altText,
        rawMediaUrl,
        mediaUrl,
        isImageUrl,
        isVideoUrl,
        isAudioUrl,
        isMarkdownMedia
      });
      
      // マークダウンメディア記法でない場合は通常のリンクとして処理（スキップ）
      if (!isMarkdownMedia) {
        continue;
      }
      
      // メディアの前のテキスト部分を追加
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText.trim()) {
          parts.push(
            <span key={`text-${lastIndex}`}>{beforeText}</span>
          );
        }
      }
      
      // メディア要素を作成
      if (isAudioUrl && !isImageUrl && !isVideoUrl) {
        // 音声要素
        parts.push(
          <div key={`audio-${match.index}`} className="my-4">
            <audio
              controls
              className="w-full max-w-md rounded-lg shadow-md"
              preload="metadata"
              onError={(e) => {
                console.warn('Audio failed to load:', {
                  url: mediaUrl,
                  alt: altText,
                  error: e.type
                });
              }}
              onLoadStart={() => {
                console.log('Audio loading started:', mediaUrl);
              }}
            >
              <source src={mediaUrl} type="audio/wav" />
              <source src={mediaUrl.replace('.wav', '.mp3')} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            {altText && (
              <p className="text-sm text-gray-600 mt-2 italic">{altText}</p>
            )}
          </div>
        );
      } else if (isVideoUrl && !isImageUrl) {
        // 動画要素
        parts.push(
          <div key={`video-${match.index}`} className="my-4">
            <video
              controls
              className="w-full h-auto rounded-lg shadow-md"
              preload="metadata"
              onError={(e) => {
                console.warn('Video failed to load:', {
                  url: mediaUrl,
                  alt: altText,
                  error: e.type
                });
              }}
              onLoadStart={() => {
                console.log('Video loading started:', mediaUrl);
              }}
            >
              <source src={mediaUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {altText && (
              <p className="text-sm text-gray-600 mt-2 italic">{altText}</p>
            )}
          </div>
        );
      } else {
        // 画像要素
        // パスの正規化: /generated-images/ を確実に処理
        const normalizedUrl = mediaUrl.startsWith('/generated-images/') 
          ? mediaUrl 
          : mediaUrl.startsWith('generated-images/') 
            ? `/${mediaUrl}` 
            : mediaUrl;
            
        parts.push(
          <div key={`img-${match.index}`} className="my-3">
            <img
              src={normalizedUrl}
              alt={altText}
              className="max-w-full h-auto rounded-lg shadow-md cursor-grab active:cursor-grabbing hover:scale-105 transition-transform duration-300"
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', normalizedUrl);
                e.dataTransfer.setData('application/json', JSON.stringify({
                  url: normalizedUrl,
                  type: 'markdown-image',
                  source: 'chat'
                }));
                console.log('Drag started for markdown image:', normalizedUrl);
              }}
              onClick={() => window.open(normalizedUrl, '_blank')}
              onError={(e) => {
                console.warn('Image failed to load:', {
                  url: normalizedUrl,
                  originalUrl: mediaUrl,
                  alt: altText,
                  error: e.type
                });
                
                // 代替パスを試行
                const target = e.target as HTMLImageElement;
                const currentSrc = target.src;
                
                // まだ代替パスを試していない場合
                if (!target.dataset.retried) {
                  target.dataset.retried = 'true';
                  
                  // 異なるパス形式を試行
                  let alternativeUrl = '';
                  if (currentSrc.includes('/generated-images/')) {
                    // 絶対パスから相対パスに変更
                    alternativeUrl = currentSrc.replace(/^.*\/generated-images\//, './generated-images/');
                  } else {
                    // 相対パスから絶対パスに変更
                    alternativeUrl = `/generated-images/${currentSrc.split('/').pop()}`;
                  }
                  
                  console.log('Trying alternative URL:', alternativeUrl);
                  target.src = alternativeUrl;
                  return;
                }
                
                // 全ての試行が失敗した場合のみエラー表示
                target.style.display = 'none';
                
                // エラーメッセージ要素を作成
                const errorDiv = document.createElement('div');
                errorDiv.className = 'bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm';
                errorDiv.innerHTML = `⚠️ 画像の読み込みに失敗しました<br><small class="text-red-500">${normalizedUrl}</small><br><small class="text-gray-500">ファイルが存在しないか、パスが正しくない可能性があります</small>`;
                target.parentNode?.insertBefore(errorDiv, target);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', normalizedUrl);
              }}
            />
            {altText && (
              <p className="text-sm text-gray-600 mt-1 italic">{altText}</p>
            )}
          </div>
        );
      }
      
      lastIndex = match.index + fullMatch.length;
    }
    
    // 残りのテキスト部分を追加
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText.trim()) {
        parts.push(
          <span key={`text-${lastIndex}`}>{remainingText}</span>
        );
      }
    }
    
    return parts.length > 0 ? parts : [text];
  };

  // HTML文字列から純粋なテキストのみを抽出する関数
  const stripHtmlTags = (html: string) => {
    // ... existing code ...
  };

  // ツール実行結果のレンダリング
  const renderToolResult = (toolState: ToolCallState) => {
    const { toolName, args, result } = toolState;
    
    // ツール名に基づいて結果を表示
    switch (toolName) {
      case 'presentationPreviewTool':
      case 'htmlSlideTool':
        if (result?.htmlContent) {
          const htmlPreview = presentationTools[toolState.id]?.htmlContent || result.htmlContent;
          const title = presentationTools[toolState.id]?.title || result.title || 'プレゼンテーションプレビュー';
          return (
            <div className="mt-2">
              <div className="text-sm text-gray-700 mb-2">
                {result.message || 'スライドが生成されました'}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => openPreviewPanel(htmlPreview, title)}
                  className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  スライドをプレビュー表示
                </button>
              </div>
            </div>
          );
        } else if (result?.error) {
          return <div className="mt-2 text-red-500 text-sm">{result.error}</div>;
        }
        return null;

      case 'graphicRecordingTool':
        if (result?.htmlContent) {
          const htmlPreview = presentationTools[toolState.id]?.htmlContent || result.htmlContent;
          const title = presentationTools[toolState.id]?.title || result.title || result.previewData?.title || 'グラフィックレコーディング';
          const theme = result.theme || 'green';
          const steps = result.steps || 4;
          const variant = result.variant || 1;
          
          // テーマカラーに対応するスタイルを取得
          const getThemeColor = () => {
            switch (theme) {
              case 'blue': return 'bg-blue-50 text-blue-800';
              case 'orange': return 'bg-orange-50 text-orange-800';
              case 'purple': return 'bg-purple-50 text-purple-800';
              case 'pink': return 'bg-pink-50 text-pink-800';
              default: return 'bg-green-50 text-green-800'; // green
            }
          };
          
          return (
            <div className="mt-2">
              <div className="text-sm text-gray-700 mb-2">
                {result.message || 'グラフィックレコーディングが生成されました'}
              </div>
              <div className={`flex items-center gap-2 text-xs ${getThemeColor()} px-3 py-1.5 rounded-full w-fit mb-2`}>
                <span>テーマ: {theme}</span>
                <span>•</span>
                <span>ステップ: {steps}</span>
                {variant > 1 && (
                  <>
                    <span>•</span>
                    <span>バリアント: {variant}</span>
                  </>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => openPreviewPanel(htmlPreview, title)}
                  className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  グラフィックレコーディングを表示
                </button>
              </div>
            </div>
          );
        } else if (result?.error) {
          return <div className="mt-2 text-red-500 text-sm">{result.error}</div>;
        }
        return null;
        
      case 'gemini-image-generation':
      case 'geminiImageGenerationTool':
      case 'imagen4-generation':
        if (result?.images && result.images.length > 0) {
          // 画像生成結果をグリッド表示
          return (
            <div className="mt-2">
              <div className="text-sm text-gray-700 mb-2">
                {result.images.length}枚の画像が生成されました
              </div>
              <div className="grid grid-cols-2 gap-3">
                {result.images.slice(0, 4).map((img: any, index: number) => (
                  <div 
                    key={index} 
                    className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openImagePreviewPanel(result.images, result.title || `生成された画像（${result.images.length}枚）`)}
                  >
                    <img 
                      src={img.url} 
                      alt={`生成画像 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {result.images.length > 4 && (
                  <div 
                    className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-800 flex items-center justify-center text-white text-lg font-medium cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => openImagePreviewPanel(result.images, result.title || `生成された画像（${result.images.length}枚）`)}
                  >
                    +{result.images.length - 4}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => openImagePreviewPanel(result.images, result.title || `生成された画像（${result.images.length}枚）`)}
                  className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                >
                  <PhotoIcon className="h-4 w-4 mr-2" />
                  画像をプレビュー表示
                </button>
              </div>
            </div>
          );
        } else if (result?.error) {
          return <div className="mt-2 text-red-500 text-sm">{result.error}</div>;
        }
        return null;
        
      case 'braveSearchTool':
        // ... existing code ...
      
      case 'browserbase-automation':
      case 'browser-automation-tool':
        if (result?.sessionId) {
          const browserbaseData = browserbaseTool[toolState.id];
          return (
            <div className="mt-2">
              <div className="text-sm text-gray-700 mb-2">
                ブラウザ自動化が完了しました
              </div>
              {result.pageTitle && (
                <div className="text-xs text-gray-600 mb-2">
                  ページ: {result.pageTitle}
                </div>
              )}
              
              {/* BrowserbaseToolコンポーネントを表示 */}
              <BrowserOperationSidebar
                sessionId={result.sessionId}
                replayUrl={result.replayUrl}
                liveViewUrl={result.liveViewUrl}
                pageTitle={result.pageTitle}
                autoOpenPreview={false}
                forcePanelOpen={false}
                onPreviewOpen={onPreviewOpen}
                onPreviewClose={onPreviewClose}
                onPreviewWidthChange={onPreviewWidthChange}
              />
            </div>
          );
        } else if (result?.error) {
          return <div className="mt-2 text-red-500 text-sm">{result.error}</div>;
        }
        return null;
      
      case 'minimax-tts':
        if (result?.audio_url) {
          return (
            <div className="mt-2">
              <div className="text-sm text-gray-700 mb-2">
                {result.message || '音声生成が完了しました'}
              </div>
              
              {/* 音声ファイル情報 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <span className="font-medium">🎵 音声ファイル</span>
                  {result.filename && (
                    <>
                      <span>•</span>
                      <span>{result.filename}</span>
                    </>
                  )}
                  {result.file_size && (
                    <>
                      <span>•</span>
                      <span>{Math.round(result.file_size / 1000)}KB</span>
                    </>
                  )}
                  {result.duration && (
                    <>
                      <span>•</span>
                      <span>{Math.round(result.duration)}秒</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* 音声プレイヤー */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <audio
                  controls
                  className="w-full"
                  preload="metadata"
                  onError={(e) => {
                    console.warn('Audio failed to load:', {
                      url: result.audio_url,
                      error: e.type
                    });
                  }}
                  onLoadStart={() => {
                    console.log('Audio loading started:', result.audio_url);
                  }}
                >
                  <source src={result.audio_url} type="audio/mp3" />
                  <source src={result.audio_url.replace('.mp3', '.wav')} type="audio/wav" />
                  Your browser does not support the audio element.
                </audio>
                
                {/* ダウンロードリンク */}
                {result.download_url && (
                  <div className="mt-3 text-center">
                    <a
                      href={result.download_url}
                      download={result.filename}
                      className="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-md text-xs hover:bg-gray-700 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      ダウンロード
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        } else if (result?.error) {
          return <div className="mt-2 text-red-500 text-sm">{result.error}</div>;
        }
        return null;
      
      default:
        // ... existing code ...
    }
  };

  // メッセージコンテンツを文字列として取得
  const getMessageContent = () => {
    if (typeof message.content === 'string') {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      return message.content
        .filter(part => part.type === 'text' && part.text)
        .map(part => part.text)
        .join('');
    }
    return '';
  };

  const content = getMessageContent();

  // ツールメッセージは表示しない
  if (message.role === 'tool' || !content.trim()) {
    return null;
  }

  // ユーザーメッセージ（右側、ダーク背景）
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[70%] px-4 py-3 rounded-2xl bg-gray-800 text-white">
          <div className="text-base leading-relaxed">
            {content.split('\n').map((line, i) => (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // アシスタントメッセージ（左側、ライト背景）
  if (message.role === 'assistant') {
    // ツールの呼び出しUIを構築
    const toolCallUiElements = Object.values(toolCallStates).map(toolState => {
      // プレゼンテーションプレビューツールかどうかを確認
      const isPresentationTool = 
        toolState.toolName === 'presentationPreviewTool' || 
        toolState.toolName === 'htmlSlideTool' ||
        toolState.toolName === 'graphicRecordingTool';
      
      // このツールのHTMLコンテンツを取得
      const previewData = presentationTools[toolState.id];
      
      // このツールの画像データを取得
      const imageData = imageTool[toolState.id];
      
      // このツールのBrowserbaseデータを取得
      const browserbaseData = toolState.result?.sessionId ? {
        sessionId: toolState.result.sessionId,
        replayUrl: toolState.result.replayUrl,
        liveViewUrl: toolState.result.liveViewUrl,
        pageTitle: toolState.result.pageTitle
      } : browserbaseTool[toolState.id] || null;
      
      return (
        <CollapsibleToolSection 
          key={toolState.id} 
          toolName={toolState.toolName} 
          toolState={toolState.status} 
          isLoading={isLoading}
          isPreviewTool={isPresentationTool}
          isImageTool={toolState.toolName === 'gemini-image-generation' || toolState.toolName === 'geminiImageGenerationTool' || toolState.toolName === 'imagen4-generation'}
          isBrowserbaseTool={toolState.toolName === 'browserbase-automation' || toolState.toolName === 'browser-automation-tool'}
          onPreviewClick={() => {
            if (previewData) {
              openPreviewPanel(previewData.htmlContent, previewData.title);
            } else if (toolState.result?.htmlContent) {
              openPreviewPanel(
                toolState.result.htmlContent, 
                toolState.result.title || 'プレゼンテーションプレビュー'
              );
            }
          }}
          onImageClick={() => {
            if (imageData) {
              openImagePreviewPanel(imageData.images, imageData.title);
            } else if (toolState.result?.images && toolState.result.images.length > 0) {
              openImagePreviewPanel(
                toolState.result.images,
                `生成された画像（${toolState.result.images.length}枚）`
              );
            }
          }}
          onBrowserbaseClick={() => {
            if (onBrowserbasePreview && toolState.result?.sessionId) {
              onBrowserbasePreview({
                sessionId: toolState.result.sessionId,
                replayUrl: toolState.result.replayUrl,
                liveViewUrl: toolState.result.liveViewUrl,
                pageTitle: toolState.result.pageTitle
              });
            }
          }}
          previewHtml={previewData?.htmlContent || toolState.result?.htmlContent}
          imageUrls={imageData?.images?.map(img => img.url) || 
                    (toolState.result?.images ? toolState.result.images.map((img: {url: string}) => img.url) : [])}
          browserbaseData={browserbaseData}
        >
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-1">ツール引数</h4>
              <pre className="text-xs bg-black/5 p-2 rounded-md overflow-auto">
                {JSON.stringify(toolState.args, null, 2)}
              </pre>
            </div>
            
            {(toolState.status === 'success' || toolState.status === 'error') && toolState.result !== undefined && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1">ツール結果</h4>
                
                {/* browser-automation-toolの特別な処理 */}
                {(toolState.toolName === 'browser-automation-tool' || toolState.toolName === 'browserbase-automation') && toolState.result?.markdownContent ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
                    {/* Markdownコンテンツをレンダリング */}
                    <div className="prose prose-sm max-w-none">
                      {toolState.result.markdownContent.split('\n').map((line: string, i: number) => {
                        // 画像の処理
                        if (line.includes('![') && line.includes('](data:image')) {
                          const altMatch = line.match(/!\[([^\]]*)\]/);
                          const srcMatch = line.match(/\(data:image[^)]+\)/);
                          if (altMatch && srcMatch) {
                            const alt = altMatch[1];
                            const src = srcMatch[0].slice(1, -1);
                            return (
                              <div key={i} className="my-3">
                                <img 
                                  src={src} 
                                  alt={alt}
                                  className="rounded-lg border border-gray-200 max-w-full"
                                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                                />
                                <p className="text-xs text-gray-500 mt-1">{alt}</p>
                              </div>
                            );
                          }
                        }
                        
                        // ヘッダーの処理
                        if (line.startsWith('#')) {
                          const level = line.match(/^#+/)?.[0].length || 1;
                          const text = line.replace(/^#+\s*/, '');
                          
                          // レベルに応じたスタイルを適用
                          if (level === 1) {
                            return <h1 key={i} className="font-semibold text-lg mb-2">{text}</h1>;
                          } else if (level === 2) {
                            return <h2 key={i} className="font-semibold text-base mb-2">{text}</h2>;
                          } else if (level === 3) {
                            return <h3 key={i} className="font-semibold text-sm mb-2">{text}</h3>;
                          } else if (level === 4) {
                            return <h4 key={i} className="font-semibold text-sm mb-2">{text}</h4>;
                          } else if (level === 5) {
                            return <h5 key={i} className="font-semibold text-sm mb-2">{text}</h5>;
                          } else {
                            return <h6 key={i} className="font-semibold text-sm mb-2">{text}</h6>;
                          }
                        }
                        
                        // リストの処理
                        if (line.match(/^[-*]\s/)) {
                          return <li key={i} className="ml-4 list-disc">{line.replace(/^[-*]\s/, '')}</li>;
                        }
                        
                        // コードブロックの処理
                        if (line.startsWith('```')) {
                          return null; // コードブロックは別途処理
                        }
                        
                        // 通常のテキスト
                        return line.trim() ? <p key={i} className="mb-2">{line}</p> : <br key={i} />;
                      })}
                    </div>
                    
                    {/* 実行ステップ情報がある場合は表示 */}
                    {toolState.result.executionSteps && toolState.result.executionSteps.length > 0 && (
                      <details className="bg-gray-50 rounded-lg p-3">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700">
                          実行ステップ詳細 ({toolState.result.executionSteps.length}ステップ)
                        </summary>
                        <div className="mt-2 space-y-2">
                          {toolState.result.executionSteps.map((step: any, index: number) => (
                            <div key={index} className="text-xs space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`inline-block w-4 h-4 rounded-full ${
                                  step.status === 'success' ? 'bg-green-500' : 
                                  step.status === 'retried' ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`} />
                                <span className="font-medium">ステップ {step.step}: {step.action}</span>
                              </div>
                              {step.verificationResult && (
                                <div className="ml-6 text-gray-600">{step.verificationResult}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                    
                    {/* Browserbaseプレビューボタン */}
                    {toolState.result.sessionId && (
                      <div className="pt-2">
                        {/* BrowserbaseToolコンポーネントを表示 */}
                        <BrowserOperationSidebar
                          sessionId={toolState.result.sessionId}
                          replayUrl={toolState.result.replayUrl}
                          liveViewUrl={toolState.result.liveViewUrl}
                          pageTitle={toolState.result.pageTitle}
                          autoOpenPreview={false}
                          forcePanelOpen={false}
                          onPreviewOpen={onPreviewOpen}
                          onPreviewClose={onPreviewClose}
                          onPreviewWidthChange={onPreviewWidthChange}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <pre className={`text-xs ${toolState.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-black/5'} p-2 rounded-md overflow-auto max-h-96`}>
                    {typeof toolState.result === 'string' 
                      ? toolState.result 
                      : JSON.stringify(toolState.result, (key, value) => {
                          // Base64データを省略
                          if (key === 'b64Json' || key === 'screenshot' || (key === 'markdownContent' && value && value.length > 1000)) {
                            return '[画像データ省略]';
                          }
                          return value;
                        }, 2)}
                  </pre>
                )}
                
                {/* 画像生成ツールの結果表示 */}
                {(toolState.toolName === 'gemini-image-generation' || toolState.toolName === 'geminiImageGenerationTool' || toolState.toolName === 'imagen4-generation') && toolState.result?.images && toolState.result.images.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">生成された画像</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {toolState.result.images.slice(0, 4).map((image: { url: string, b64Json: string }, index: number) => (
                        <div 
                          key={`img-${index}`} 
                          className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openImagePreviewPanel(
                            toolState.result.images,
                            `生成された画像（${toolState.result.images.length}枚）`
                          )}
                        >
                          <img 
                            src={image.url} 
                            alt={`生成画像 ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))}
                      {toolState.result.images.length > 4 && (
                        <div 
                          className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-800 flex items-center justify-center text-white text-lg font-medium cursor-pointer hover:bg-gray-700 transition-colors"
                          onClick={() => openImagePreviewPanel(
                            toolState.result.images,
                            `生成された画像（${toolState.result.images.length}枚）`
                          )}
                        >
                          +{toolState.result.images.length - 4}
                        </div>
                      )}
                    </div>
                    
                    {/* 画像プレビューボタン */}
                    <div className="mt-4">
                      <button
                        onClick={() => openImagePreviewPanel(
                          toolState.result.images,
                          `生成された画像（${toolState.result.images.length}枚）`
                        )}
                        className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                      >
                        <PhotoIcon className="h-4 w-4 mr-2" />
                        画像をプレビュー表示
                      </button>
                    </div>
                  </div>
                )}
                
                {/* 動画生成ツールの結果表示 */}
                {(toolState.toolName === 'veo2-video-generation' || toolState.toolName === 'gemini-video-generation') && toolState.result?.videos && toolState.result.videos.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">生成された動画</h4>
                    <div className="space-y-3">
                      {toolState.result.videos.map((video: { url: string }, index: number) => (
                        <div key={`tool-video-${index}`} className="space-y-2">
                          <video 
                            controls 
                            width="100%" 
                            style={{ maxWidth: '400px' }}
                            className="rounded-lg border border-gray-200"
                          >
                            <source src={video.url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          <div className="text-xs text-gray-500">
                            Video {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* プレゼンテーションプレビューボタン（結果の下にも表示） */}
                {isPresentationTool && toolState.result?.htmlContent && (
                  <div className="mt-3">
                    <button
                      onClick={() => openPreviewPanel(
                        toolState.result.htmlContent, 
                        toolState.result.title || 'プレゼンテーションプレビュー'
                      )}
                      className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      スライドをプレビュー表示
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 🔧 **browser-automation-toolの即座表示** */}
          {(toolState.toolName === 'browser-automation-tool' || toolState.toolName === 'browserbase-automation') && (
            <div className="mt-3">
              <BrowserOperationSidebar
                sessionId={`loading-${toolState.id}`}
                replayUrl="#loading"
                liveViewUrl="#loading"
                pageTitle="ブラウザ自動化実行中..."
                autoOpenPreview={false}
                forcePanelOpen={false}
                onPreviewOpen={onPreviewOpen}
                onPreviewClose={onPreviewClose}
                onPreviewWidthChange={onPreviewWidthChange}
              />
            </div>
          )}
        </CollapsibleToolSection>
      );
    });

    return (
      <>
        {/* アシスタントテキストコンテンツ */}
        {content.trim() && (
          <div className="flex justify-start mb-6">
            <div className="w-full max-w-3xl px-4 py-3 rounded-2xl bg-gray-100 text-gray-800">
              <div className="text-base leading-relaxed">
                {content.split('\n').map((line, i) => (
                  <div key={i} className={i > 0 ? 'mt-2' : ''}>
                    {renderMarkdownMedia(line)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* 画像生成ツールの結果を直接表示 */}
        {Object.values(toolCallStates).some(
          tool => (tool.toolName === 'gemini-image-generation' || tool.toolName === 'geminiImageGenerationTool' || tool.toolName === 'imagen4-generation') && 
                 tool.status === 'success' && 
                 tool.result?.images?.length > 0
        ) && (
          <div className="flex justify-start mb-6">
            <div className="w-full max-w-3xl px-4 py-3 rounded-2xl bg-gray-100 text-gray-800">
              <h3 className="font-medium text-base mb-2">生成された画像</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.values(toolCallStates)
                  .filter(tool => 
                    (tool.toolName === 'gemini-image-generation' || tool.toolName === 'geminiImageGenerationTool' || tool.toolName === 'imagen4-generation') && 
                    tool.status === 'success' && 
                    tool.result?.images?.length > 0
                  )
                  .flatMap(tool => 
                    tool.result.images.map((image: { url: string; b64Json: string }, index: number) => (
                      <div 
                        key={`direct-img-${tool.id}-${index}`} 
                        className="aspect-square border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => openImagePreviewPanel(
                          tool.result.images, 
                          tool.result.title || `生成された画像（${tool.result.images.length}枚）`
                        )}
                      >
                        <img 
                          src={image.url} 
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))
                  )
                }
              </div>
              
              {/* 画像プレビューボタン */}
              <div className="mt-4">
                <button
                  onClick={() => {
                    const tool = Object.values(toolCallStates).find(t => 
                      (t.toolName === 'gemini-image-generation' || t.toolName === 'geminiImageGenerationTool' || t.toolName === 'imagen4-generation') && 
                      t.status === 'success' && 
                      t.result?.images?.length > 0
                    );
                    
                    if (tool) {
                      openImagePreviewPanel(
                        tool.result.images,
                        tool.result.title || `生成された画像（${tool.result.images.length}枚）`
                      );
                    }
                  }}
                  className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
                >
                  <PhotoIcon className="h-4 w-4 mr-2" />
                  画像をプレビュー表示
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 動画生成ツールの結果を直接表示 */}
        {Object.values(toolCallStates).some(
          tool => (tool.toolName === 'veo2-video-generation' || tool.toolName === 'gemini-video-generation') && 
                 tool.status === 'success' && 
                 tool.result?.videos?.length > 0
        ) && (
          <div className="flex justify-start mb-6">
            <div className="w-full max-w-3xl px-4 py-3 rounded-2xl bg-gray-100 text-gray-800">
              <h3 className="font-medium text-base mb-3">🎬 生成された動画</h3>
              <div className="space-y-4">
                {Object.values(toolCallStates)
                  .filter(tool => 
                    (tool.toolName === 'veo2-video-generation' || tool.toolName === 'gemini-video-generation') && 
                    tool.status === 'success' && 
                    tool.result?.videos?.length > 0
                  )
                  .flatMap(tool => 
                    tool.result.videos.map((video: { url: string }, index: number) => (
                      <div key={`direct-video-${tool.id}-${index}`} className="space-y-3">
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                          <video 
                            controls 
                            width="100%" 
                            style={{ maxWidth: '800px' }}
                            className="rounded-lg"
                            preload="metadata"
                            onError={(e) => {
                              console.error('Video load error:', e);
                              console.log('Video URL:', video.url);
                            }}
                            onLoadStart={() => {
                              console.log('Video loading started:', video.url);
                            }}
                          >
                            <source src={video.url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          <div className="mt-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                Veo2
                              </span>
                              <span className="text-gray-500">•</span>
                              <span>Video {index + 1}</span>
                            </div>
                            {tool.result.title && (
                              <div className="mt-2">
                                <strong>Prompt:</strong> <em>{tool.result.title}</em>
                              </div>
                            )}
                            <div className="mt-1 text-xs text-gray-500">
                              URL: {video.url}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                }
              </div>
            </div>
          </div>
        )}
        
        {/* ツールUIの表示 */}
        {toolCallUiElements.length > 0 && (
          <div className="w-full max-w-3xl mb-6">
            {toolCallUiElements}
          </div>
        )}
        
        {/* 🔧 **browser-automation-toolの無条件表示** */}
        {Object.values(toolCallStates).some(tool => 
          tool.toolName === 'browser-automation-tool' || tool.toolName === 'browserbase-automation'
        ) && (
          <div className="w-full max-w-3xl mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">🌐 ブラウザ操作サイドバー</h3>
              <BrowserOperationSidebar
                sessionId="browser-automation-active"
                replayUrl="#active"
                liveViewUrl="#active"
                pageTitle="ブラウザ自動化実行中..."
                autoOpenPreview={true}
                forcePanelOpen={true}
                onPreviewOpen={onPreviewOpen}
                onPreviewClose={onPreviewClose}
                onPreviewWidthChange={onPreviewWidthChange}
              />
            </div>
          </div>
        )}
        
        {/* プレゼンテーションプレビューパネル */}
        {presentationPreview.htmlContent && (
          <PresentationPreviewPanel
            htmlContent={presentationPreview.htmlContent}
            title={presentationPreview.title}
            isOpen={presentationPreview.isOpen}
            onClose={closePreviewPanel}
            onWidthChange={handlePreviewPanelWidthChange}
          />
        )}
        
        {/* 画像プレビューパネル */}
        {imagePreview.images.length > 0 && (
          <ImagePreviewPanel
            images={imagePreview.images}
            title={imagePreview.title}
            isOpen={imagePreview.isOpen}
            onClose={closeImagePreviewPanel}
            onWidthChange={handlePreviewPanelWidthChange}
          />
        )}
      </>
    );
  }

  return null;
}; 