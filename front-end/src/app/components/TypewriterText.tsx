import { useState, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import type { TypewriterTextProps } from '../../types';

export function TypewriterText({ content, onComplete, speed = 20 }: TypewriterTextProps) {
  const [displayedContent, setDisplayedContent] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timeout = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === content.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, content, onComplete, speed]);

  return (
    <ChatMessage
      id=''
      fileId=''
      fileName=''
      role='assistant'
      content={displayedContent}
      isTyping={currentIndex < content.length}
      showMenu={currentIndex === content.length}
    />
  );
}
