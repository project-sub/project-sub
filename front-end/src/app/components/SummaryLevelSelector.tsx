import { motion } from 'motion/react';
import { FileText, AlignLeft, BookOpen, type LucideIcon } from 'lucide-react';
import type { SummaryLevelSelectorProps, SummaryLevel } from '../../types';

interface LevelOption {
  level: SummaryLevel;
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
}

export function SummaryLevelSelector({ onSelect, disabled = false }: SummaryLevelSelectorProps){
  const options: LevelOption[] = [
    {
      level: 'brief',
      icon: FileText,
      label: '간략히',
      description: '핵심만 빠르게',
      color: 'from-green-500 to-emerald-600',
    },
    {
      level: 'normal',
      icon: AlignLeft,
      label: '기본',
      description: '균형잡힌 요약',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      level: 'detailed',
      icon: BookOpen,
      label: '상세히',
      description: '모든 내용 포함',
      color: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex gap-4 mb-6"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          ✨
        </motion.div>
      </div>

      <div className="bg-gray-100 rounded-2xl p-4 max-w-3xl">
        <p className="text-gray-900 mb-4">
          어떤 형태로 요약해드릴까요?
        </p>

        <div className="grid grid-cols-3 gap-3">
          {options.map((option) => (
            <motion.button
              key={option.level}
              onClick={() => onSelect(option.level)}
              whileHover={disabled ? undefined : { scale: 1.05 }}
              whileTap={disabled ? undefined : { scale: 0.95 }}
              disabled={disabled}
              className={`bg-white rounded-xl p-4 border-2 transition-all text-left group ${
                disabled
                  ? 'border-gray-200 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center mb-3`}>
                <option.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {option.label}
              </h3>
              <p className="text-xs text-gray-500">
                {option.description}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
