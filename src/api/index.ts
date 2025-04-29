import { MemberCard, UsageRecord } from '../types';

// 自动检测API基础URL
const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:5000/api'  // 开发环境
  : '/api';  // 生产环境（相对路径）

// 通用请求函数
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || '请求失败');
  }

  return response.json();
};

// 会员卡相关API
export const fetchCards = async (): Promise<MemberCard[]> => {
  return fetchAPI('/cards');
};

export const fetchCard = async (id: string): Promise<MemberCard> => {
  return fetchAPI(`/cards/${id}`);
};

export const createCard = async (card: Omit<MemberCard, 'id' | 'pauseHistory'>): Promise<MemberCard> => {
  return fetchAPI('/cards', {
    method: 'POST',
    body: JSON.stringify(card),
  });
};

export const updateCard = async (card: MemberCard): Promise<MemberCard> => {
  return fetchAPI(`/cards/${card.id}`, {
    method: 'PUT',
    body: JSON.stringify(card),
  });
};

export const batchUpdateCards = async (cards: MemberCard[]): Promise<MemberCard[]> => {
  return fetchAPI('/cards', {
    method: 'PUT',
    body: JSON.stringify(cards),
  });
};

export const deleteCard = async (id: string): Promise<void> => {
  return fetchAPI(`/cards/${id}`, {
    method: 'DELETE',
  });
};

// 使用记录相关API
export const fetchRecords = async (): Promise<UsageRecord[]> => {
  return fetchAPI('/records');
};

export const fetchCardRecords = async (cardId: string): Promise<UsageRecord[]> => {
  return fetchAPI(`/cards/${cardId}/records`);
};

export const createRecord = async (record: Omit<UsageRecord, 'id'>): Promise<UsageRecord> => {
  return fetchAPI('/records', {
    method: 'POST',
    body: JSON.stringify(record),
  });
};

export const batchCreateRecords = async (records: Omit<UsageRecord, 'id'>[]): Promise<UsageRecord[]> => {
  return fetchAPI('/records/batch', {
    method: 'POST',
    body: JSON.stringify(records),
  });
};

export const updateRecord = async (record: UsageRecord): Promise<UsageRecord> => {
  return fetchAPI(`/records/${record.id}`, {
    method: 'PUT',
    body: JSON.stringify(record),
  });
};

export const batchUpdateRecords = async (records: UsageRecord[]): Promise<UsageRecord[]> => {
  return fetchAPI('/records', {
    method: 'PUT',
    body: JSON.stringify(records),
  });
};

export const deleteRecord = async (id: string): Promise<void> => {
  return fetchAPI(`/records/${id}`, {
    method: 'DELETE',
  });
};

export const batchDeleteRecords = async (ids: string[]): Promise<void> => {
  return fetchAPI('/records', {
    method: 'DELETE',
    body: JSON.stringify(ids),
  });
};

// 导入导出相关API
export const exportData = async (): Promise<{ cards: MemberCard[], records: UsageRecord[], exportDate: string }> => {
  return fetchAPI('/export');
};

export const importData = async (file: File): Promise<{ message: string, cardsCount: number, recordsCount: number }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const url = `${API_BASE_URL}/import`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '导入失败' }));
    throw new Error(error.message || '导入失败');
  }

  return response.json();
}; 