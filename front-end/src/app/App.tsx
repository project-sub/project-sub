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
import { fetchHistory, requestSummary, deleteHistory } from '../api/summary';

import type {
  Message,
  SummaryLevel,
  HistoryItem,
} from '../types';

// 1. 요약 데이터 객체 타입 정의
interface SummaryData {
  id: string;
  fileID: string;
  fileName: string;
  summary: string | null;
  category: string | null;
}

// 2. 소켓 객체 타입 정의
interface TaskStatus {
  percent: number,
  state : string
}

// 3. websocket에서 응답 티입 정의
interface WebhookMessage {
  percent:number,
  state: "PENDING"|"SUCCESS"|"FAILURE"|"PROGRESS"|string,
  extracted_text?:string | null,
  summary?: string | null,
  category?: string | null
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showTypewriter, setShowTypewriter] = useState<boolean>(false);
  const [showLevelSelector, setShowLevelSelector] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    id: '',
    fileID: '',
    fileName: '',
    summary: null,
    category: null
  });
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [currentLevel, setCurrentLevel] = useState<SummaryLevel>('normal');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isProcess, setIsProcess]= useState<TaskStatus>({percent:0, state:""}); // 로딩상태
  const [extractedText, setExtractedText] = useState<string | null>(null); // ocr 이후 추출된 텍스트
  const isFetched = useRef<boolean>(false);

  const wsRef = useRef<WebSocket|null>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing, showTypewriter, showLevelSelector]);

  const handleLogin = useCallback(async (user: User): Promise<void> => {
    setUser(user);

    try {
      const historyData = await fetchHistory();
      setHistory(historyData);
    } catch (e) {
      console.error("이력 조회 실패:", e);
    }
  }, [setUser, setHistory]);

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

  const handleFileSelect = useCallback(async (file: File): Promise<void> => {
    setCurrentFile(file);
    setMessages((prev) => [
      ...prev,
      {
        id: 'new',
        fileId: '',
        fileName: '',
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
          const res = await requestSummary(messages[0].id, currentFile, level);

          // 상태에 저장 (즉시 다운로드하지 않음)
          setSummaryData({
              id: res.id,
              fileID: res.fileId,
              fileName :res.fileName,
              summary:null,
              category:null
          });

          const ws = new WebSocket(`ws://localhost:8000/ws/${res.fileId}`)

          wsRef.current = ws;

          ws.onerror = (event: Event) => {
            setIsProcessing(false);
            alert("웹소켓 연결 오류가 발생했습니다.");
          };

          ws.onmessage = (event:MessageEvent) => {
            const data = JSON.parse(event.data) as WebhookMessage; //서버에서 메시지 올때마다 실행. json 문자열을 딕셔너리로 변환
            setIsProcess({
              percent : data.percent,
              state : data.state
            })

            if(data.extracted_text) {
              setExtractedText(data.extracted_text);
            }

            if(data.state === "SUCCESS") {
              setSummaryData(prev=>({
                ...prev,
                summary:data.summary ?? null,
                category:data.category ?? null
              }));
              setIsProcessing(false); // 로딩바 숨김
              setShowTypewriter(true);
              ws.close();
            }

            if(data.state === "FAILURE") {
              setIsProcessing(false);
              alert("파일 처리 중에 오류가 발생했습니다.1.")
              ws.close()
            }
          }
      } catch (error) {
        console.error(error);

        setMessages((prev) => [
          ...prev,
          {
            id: 'error',
            fileId: '',
            fileName: '',
            role: 'assistant',
            content: '파일 요약 중 오류가 발생했습니다.',
            timestamp: new Date(),
          },
        ]);
      }
    },
    [currentFile]
  );

  const handleTypingComplete = useCallback((): void => {
    setShowTypewriter(false);
    const newMessages: Message[] = [
      ...messages,
      {
        id: summaryData.id,
        fileId: summaryData.fileID,
        fileName: summaryData.fileName,
        role: 'assistant',
        content: summaryData.summary ?? '',
        showMenu: true,
        timestamp: new Date(),
      },
    ];
    setMessages(newMessages);

    // Save to history
    const historyItem: HistoryItem = {
      id: summaryData.id,
      file_id: summaryData.fileID,
      file_name: currentFile?.name || '문서',
      upload_at: new Date(),
      level: currentLevel,
      summary: (summaryData.summary ?? '').slice(0, 100) + '...',
      messages: newMessages,
    };

    setHistory((prev) => {
      const exists = prev.some((h)=> h.id === historyItem.id);
      if(exists){
        return [
          historyItem,
          ...prev.filter((h)=> h.id !== historyItem.id)];
      }
      return [historyItem, ...prev]
    });
    setCurrentHistoryId(historyItem.id);
  }, [messages, summaryData.summary ?? '', currentFile, currentLevel]);

const handleSelectHistory = useCallback(
    async (id: string): Promise<void> => {
      const details = await fetchHistory(id);

      const selectMessages: Message[] = details.map((item) => ({
        id: item?.id ?? 'error',
        fileId: item?.file_id ?? '',
        fileName: item?.file_name ?? '',
        role: 'assistant',
        content: item?.summary ?? '',
        showMenu: true,
        timestamp: new Date(),
      }));

      if (selectMessages.length > 0) {
        setMessages(selectMessages);
        setCurrentHistoryId(id);
        setShowTypewriter(false);
        setShowLevelSelector(false);
        setIsProcessing(false);
      }
    },
    [history]
  );

  const handleDeleteHistory = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteHistory(id)
        setHistory((prev) => prev.filter((h) => h.id !== id));
        if (currentHistoryId === id) {
          handleNewChat();
        }
      } catch (error) {
        console.error("삭제 처리 실패:", error);
        alert("이력 삭제에 실패했습니다. 서버 상태를 확인해주세요.");
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
                    id={message.id}
                    fileId={message.fileId}
                    fileName={message.fileName}
                    key={`${message.role}-${index}-${message.timestamp?.getTime()}`}
                    role={message.role}
                    content={message.content}
                    showMenu={message.showMenu}
                  />
                ))}

                {showLevelSelector && (
                  <SummaryLevelSelector onSelect={handleLevelSelect} />
                )}

                {isProcessing && (
                  <TypingIndicator
                    percent={isProcess.percent}
                    state={isProcess.state}
                   />
                )}

                {showTypewriter && (
                  <TypewriterText
                    content={summaryData.summary ?? ''}
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
