import { Upload, Paperclip } from 'lucide-react';
import { useState, type DragEvent, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { DragDropZoneProps } from '../../types';

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.txt,.md,image/*';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function DragDropZone({ onFileSelect, disabled = false }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = (): void => {
    if (!disabled) {
      document.getElementById('drag-file-input')?.click();
    }
  };

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex items-center gap-3 px-4 py-3 rounded-lg
          border-2 transition-all cursor-pointer
          ${
            disabled
              ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
              : isDragging
              ? 'bg-blue-50 border-blue-500 border-solid'
              : 'bg-white border-gray-200 border-dashed hover:border-gray-300'
          }
        `}
        onClick={handleClick}
      >
        <input
          type="file"
          id="drag-file-input"
          className="hidden"
          accept={ACCEPTED_FILE_TYPES}
          onChange={handleFileChange}
          disabled={disabled}
        />

        <div className={`
          p-2 rounded-lg transition-colors
          ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
        `}>
          <Paperclip className={`w-4 h-4 ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>

        <div className="flex-1">
          <p className={`text-sm ${isDragging ? 'text-blue-600' : 'text-gray-500'}`}>
            {isDragging
              ? '파일을 여기에 놓으세요'
              : '파일을 드래그하거나 클릭하여 업로드하세요'}
          </p>
        </div>

        {isDragging && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-3"
          >
            <Upload className="w-5 h-5 text-blue-600" />
          </motion.div>
        )}
      </div>

      {/* Full screen overlay when dragging */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-blue-500/10 backdrop-blur-sm z-50 pointer-events-none"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-center h-full">
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-12 border-4 border-dashed border-blue-500"
              >
                <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <p className="text-2xl font-semibold text-gray-900 text-center">
                  파일을 여기에 놓으세요
                </p>
                <p className="text-gray-500 text-center mt-2">
                  분석을 시작합니다
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
