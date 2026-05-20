import type { User, LoginFormErrors } from './user.types';

/**
 * Message Types
 */
export type MessageRole = 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
  showMenu?: boolean;
  timestamp?: Date;
}

/**
 * Summary Types
 */
export type SummaryLevel = 'brief' | 'normal' | 'detailed';

export interface SummaryRequest {
  file: File;
  level: SummaryLevel;
}

export interface SummaryResponse {
  content: string;
  level: SummaryLevel;
  timestamp: Date;
}

/**
 * History Types
 */
export interface HistoryItem {
  id: string;
  fileName: string;
  timestamp: Date;
  level: SummaryLevel;
  preview: string;
  messages: Message[];
}

export interface HistoryFilter {
  searchQuery?: string;
  level?: SummaryLevel;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * File Upload Types
 */
export interface FileUploadState {
  file: File | null;
  isUploading: boolean;
  progress: number;
  error?: string;
}

export interface AcceptedFileTypes {
  'application/pdf': string[];
  'image/*': string[];
  'text/plain': string[];
  'application/msword': string[];
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': string[];
}

/**
 * Component Props Types
 */
export interface ChatMessageProps {
  role: MessageRole;
  content: string;
  isTyping?: boolean;
  showMenu?: boolean;
}

export interface DragDropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
}

export interface SummaryLevelSelectorProps {
  onSelect: (level: SummaryLevel) => void;
  disabled?: boolean;
}

export interface HistorySidebarProps {
  history: HistoryItem[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}

export interface UserMenuProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export interface TypewriterTextProps {
  content: string;
  onComplete: () => void;
  speed?: number;
}

/**
 * App State Types
 */
export interface AppState {
  user: User | null;
  messages: Message[];
  isProcessing: boolean;
  showTypewriter: boolean;
  showLevelSelector: boolean;
  summaryText: string;
  currentFile: File | null;
  currentLevel: SummaryLevel;
  history: HistoryItem[];
  currentHistoryId: string | null;
}

/**
 * Validation Types
 */
export interface ValidationResult {
  isValid: boolean;
  errors: LoginFormErrors;
}

/**
 * Utility Types
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<T>;
