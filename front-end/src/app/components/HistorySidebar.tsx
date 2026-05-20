import { motion, AnimatePresence } from 'motion/react';
import { FileText, Trash2, Clock, Menu, X, Plus } from 'lucide-react';
import { useState } from 'react';

interface HistoryItem {
  id: string;
  fileName: string;
  timestamp: Date;
  level: 'brief' | 'normal' | 'detailed';
  preview: string;
}

interface HistorySidebarProps {
  history: HistoryItem[];
  currentId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}

export function HistorySidebar({
  history,
  currentId,
  onSelect,
  onDelete,
  onNewChat,
}: HistorySidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  const levelLabels = {
    brief: '간략',
    normal: '기본',
    detailed: '상세',
  };

  const levelColors = {
    brief: 'bg-green-100 text-green-700',
    normal: 'bg-blue-100 text-blue-700',
    detailed: 'bg-purple-100 text-purple-700',
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return '오늘';
    } else if (days === 1) {
      return '어제';
    } else if (days < 7) {
      return `${days}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-4 z-20 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed lg:sticky top-0 left-0 h-screen w-80 bg-gray-900 text-white flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
              <button
                onClick={onNewChat}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">새 요약</span>
              </button>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    아직 요약 이력이 없습니다
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className={`
                      relative group rounded-lg transition-all
                      ${
                        currentId === item.id
                          ? 'bg-gray-800'
                          : 'hover:bg-gray-800/50'
                      }
                    `}
                  >
                    <button
                      onClick={() => onSelect(item.id)}
                      className="w-full text-left p-3 pr-10"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate text-white">
                            {item.fileName}
                          </h3>
                        </div>
                      </div>

                      <div className="ml-7 space-y-1">
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {item.preview}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              levelColors[item.level]
                            }`}
                          >
                            {levelLabels[item.level]}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(item.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      className="absolute right-2 top-3 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
              <div className="text-xs text-gray-400 text-center space-y-1">
                <div>총 {history.length}개의 요약</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
