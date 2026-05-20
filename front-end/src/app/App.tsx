import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { TypewriterText } from './components/TypewriterText';
import { DragDropZone } from './components/DragDropZone';
import { SummaryLevelSelector } from './components/SummaryLevelSelector';
import { TypingIndicator } from './components/TypingIndicator';
import { HistorySidebar } from './components/HistorySidebar';
import { LoginScreen } from './components/LoginScreen';
import { UserMenu } from './components/UserMenu';
import type { User } from '../types/user.types';
import { requestSummary } from '../api/summary';

import type {
  Message,
  SummaryLevel,
  HistoryItem,
} from '../types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showTypewriter, setShowTypewriter] = useState<boolean>(false);
  const [showLevelSelector, setShowLevelSelector] = useState<boolean>(false);
  const [summaryText, setSummaryText] = useState<string>('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentLevel, setCurrentLevel] = useState<SummaryLevel>('normal');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, showTypewriter, showLevelSelector]);

  const handleLogin = useCallback((user: User): void => {
    setUser(user);
  }, []);

  const handleLogout = useCallback((): void => {
    setUser(null);
    setMessages([]);
    setHistory([]);
    setCurrentHistoryId(undefined);
    setShowTypewriter(false);
    setShowLevelSelector(false);
    setIsProcessing(false);
    setCurrentFile(null);
  }, []);
{/*
  const generateSummary = (fileName: string, level: SummaryLevel): string => {
    const timestamp = new Date().toLocaleString('ko-KR');

    if (level === 'brief') {
      return `📄 파일 분석 결과 (간략)

파일명: ${fileName}
분석 일시: ${timestamp}`
    }

    if (level === 'normal') {
      return `📄 파일 분석 결과

파일명: ${fileName}
분석 일시: ${timestamp}`
    }

        // detailed
    return `📄 파일 분석 결과 (상세)

파일명: ${fileName}
분석 일시: ${timestamp}`

  }
*/}

  const handleFileSelect = useCallback(async (file: File): Promise<void> => {
    setCurrentFile(file);
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        showMenu: false,
        timestamp: new Date(),
      },
    ]);

    setShowTypewriter(false);
    setShowLevelSelector(true);
  }, []);

  const handleLevelSelect = useCallback(
    async (level: SummaryLevel): Promise<void> => {
      if(!currentFile) {
        return;
      }

      setCurrentLevel(level);
      setShowLevelSelector(false);
      setIsProcessing(true);

      try {
        const summary = await requestSummary(currentFile, level);

        setSummaryText(summary);
        setShowTypewriter(true);
      } catch (error) {
        console.error(error);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '파일 요약 중 오류가 발생했습니다.',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsProcessing(true);
      }
      // Simulate processing delay
{/*
      setTimeout(() => {
        setIsProcessing(false);
        const summary = generateSummary(currentFile?.name || '문서', level);
        setSummaryText(summary);
        setShowTypewriter(true);
      }, 2000);
*/}
    },
    [currentFile]
  );

  const handleTypingComplete = useCallback((): void => {
    setShowTypewriter(false);
    const newMessages: Message[] = [
      ...messages,
      {
        role: 'assistant',
        content: summaryText,
        showMenu: true,
        timestamp: new Date(),
      },
    ];
    setMessages(newMessages);

    // Save to history
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      fileName: currentFile?.name || '문서',
      timestamp: new Date(),
      level: currentLevel,
      preview: summaryText.slice(0, 100) + '...',
      messages: newMessages,
    };

    setHistory((prev) => [historyItem, ...prev]);
    setCurrentHistoryId(historyItem.id);
  }, [messages, summaryText, currentFile, currentLevel]);

  const handleSelectHistory = useCallback(
    (id: string): void => {
      const item = history.find((h) => h.id === id);
      if (item) {
        setMessages(item.messages);
        setCurrentHistoryId(id);
        setShowTypewriter(false);
        setShowLevelSelector(false);
        setIsProcessing(false);
      }
    },
    [history]
  );

  const handleDeleteHistory = useCallback(
    (id: string): void => {
      setHistory((prev) => prev.filter((h) => h.id !== id));
      if (currentHistoryId === id) {
        handleNewChat();
      }
    },
    [currentHistoryId]
  );

  const handleNewChat = useCallback((): void => {
    setMessages([]);
    setCurrentHistoryId(undefined);
    setShowTypewriter(false);
    setShowLevelSelector(false);
    setIsProcessing(false);
    setCurrentFile(null);
  }, []);

  // Show login screen if not logged in
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* History Sidebar */}
      <HistorySidebar
        history={history}
        currentId={currentHistoryId}
        onSelect={handleSelectHistory}
        onDelete={handleDeleteHistory}
        onNewChat={handleNewChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">AI 문서 요약 도우미</h1>
                  <p className="text-sm text-gray-500">
                    파일을 업로드하면 AI가 핵심 내용을 요약해드립니다
                  </p>
                </div>
              </div>
              <UserMenu
                userName={user.name}
                userEmail={user.email}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  안녕하세요! 👋
                </h2>
                <p className="text-gray-600 mb-8">
                  파일을 업로드하면 AI가 내용을 분석하고
                  <br />
                  상세한 요약을 제공해드립니다
                </p>
                <div className="max-w-2xl mx-auto">
                  <DragDropZone onFileSelect={handleFileSelect} />
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <ChatMessage
                    key={`${message.role}-${index}-${message.timestamp?.getTime()}`}
                    role={message.role}
                    content={message.content}
                    showMenu={message.showMenu}
                  />
                ))}

                {showLevelSelector && (
                  <SummaryLevelSelector onSelect={handleLevelSelect} />
                )}

                {isProcessing && <TypingIndicator />}

                {showTypewriter && (
                  <TypewriterText
                    content={summaryText}
                    onComplete={handleTypingComplete}
                  />
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        {messages.length > 0 && (
          <div className="bg-white border-t border-gray-200 sticky bottom-0">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <DragDropZone
                onFileSelect={handleFileSelect}
                disabled={isProcessing || showTypewriter || showLevelSelector}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
