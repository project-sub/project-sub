import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import type { TypingIndicatorProps } from '../../types';

export function TypingIndicator({ percent = 0, state = ''}: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-4 mb-6"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-white" />
      </div> 

      <div className="bg-gray-100 rounded-2xl px-5 py-3">
        <div className="flex gap-1.5">
          <p>{percent==10?'텍스트 추출 중': percent==50||percent==40?"요약 중": "진행 중"}: {percent}%</p>
        </div>
      </div>
    </motion.div>
  );
}
