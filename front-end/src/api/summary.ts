import api from './axios';
import type { SummaryLevel } from '../types';

export const requestSummary = async (
  file: File,
  level: SummaryLevel
): Promise<string> => {
  const formData = new FormData();

  formData.append('file', file);
  formData.append('length', 'MIDDLE');
  formData.append('style', 'STYLE1');
  formData.append('level', level);

  const res = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true
  });

  return res.data.summary;
};