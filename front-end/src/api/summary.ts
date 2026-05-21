import api from './axios';
import type { HistoryItem, SummaryLevel } from '../types';

export interface UploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  status: string;
  create_at: string;
}

export const requestSummary = async (
  file: File,
  level: SummaryLevel
): Promise<UploadResponse> => {
  const formData = new FormData();

    // level 매핑
  const lengthMap = {
    brief: 'SHORT',
    normal: 'MIDDLE',
    detailed: 'LONG',
  };

  formData.append('file', file);
  formData.append('length', lengthMap[level]);
  formData.append('style', 'STYLE1');
  formData.append('level', level);

  const res = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true
  });

  return res.data;
};

export const fetchHistory = async (): Promise<HistoryItem[]> => {
  try {
    const res = await api.get<HistoryItem[]>('/history', {
      withCredentials: true,
    });

    return res.data;
  } catch (e) {
    console.error("이력 조회 실패:", e);
    return [];
  }
};

export const deleteHistory = async (file_id:string): Promise<void> => {
  try {
      await api.delete(`/delete/${file_id}`, {
      withCredentials: true,
    });
  } catch (e) {
    console.error("이력 삭제 실패:", e);
    throw e;
  }
};