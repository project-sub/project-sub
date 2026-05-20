import { useState, useRef, useEffect } from 'react';
import { User, Sparkles, MoreVertical, Copy, Download, Check } from 'lucide-react';
import { motion } from 'motion/react';
import type { ChatMessageProps } from '../../types';

export function ChatMessage({
  role,
  content,
  isTyping = false,
  showMenu = false,
}: ChatMessageProps) {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setMenuOpen(false);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleDownload = (): void => {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `요약_${new Date().getTime()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMenuOpen(false);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const toggleMenu = (): void => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex gap-4 mb-6 ${
        role === 'user' ? 'justify-end' : 'justify-start'
      } group`}
    >
      {role === 'assistant' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      )}

      <div className="flex items-start gap-2 max-w-3xl">
        <div
          className={`rounded-2xl px-5 py-3 ${
            role === 'user'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="whitespace-pre-wrap leading-relaxed">
            {content}
            {isTyping && (
              <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
            )}
          </p>
        </div>

        {showMenu && role === 'assistant' && !isTyping && (
          <div
            className="relative opacity-0 group-hover:opacity-100 transition-opacity"
            ref={menuRef}
          >
            <button
              onClick={toggleMenu}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="메시지 옵션"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>

            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-40 z-10"
              >
                <button
                  onClick={handleCopy}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span>복사됨!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>복사하기</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>다운로드</span>
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {role === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </motion.div>
  );
}
