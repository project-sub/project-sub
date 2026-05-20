import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export function TypingIndicator() {
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
          <motion.div
            className="w-2 h-2 bg-gray-500 rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-gray-500 rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-gray-500 rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
