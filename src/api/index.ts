import { MemberCard, UsageRecord } from '../types';

// 自动检测API基础URL
const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:5000/api'  // 开发环境
  : '/api';  // 生产环境（相对路径）

// Token管理
const TOKEN_KEY = 'auth_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// 通用请求函数
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    
    // 如果是401错误，清除token并重定向到登录页
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    
    throw new Error(error.message || '请求失败');
  }

  return response.json();
};

// 认证相关API
export const login = async (username: string, password: string, expiresIn?: string): Promise<{
  message: string;
  token: string;
  expiresAt: string;
  user: { id: string; username: string; role: string };
}> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password, expiresIn }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '登录失败' }));
    throw new Error(error.message || '登录失败');
  }

  return response.json();
};

export const verifyToken = async (): Promise<{
  message: string;
  user: { id: string; username: string; role: string };
}> => {
  return fetchAPI('/auth/verify');
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  return fetchAPI('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};

// Token管理相关API
export const createToken = async (expiresIn?: string, description?: string): Promise<{
  message: string;
  token: string;
  expiresAt: string;
  description: string;
  createdAt: string;
}> => {
  return fetchAPI('/auth/create-token', {
    method: 'POST',
    body: JSON.stringify({ expiresIn, description }),
  });
};

export const getTokenInfo = async (): Promise<{
  user: { id: string; username: string; role: string };
  issuedAt: string;
  expiresAt: string;
  timeRemaining: number;
}> => {
  return fetchAPI('/auth/token-info');
};

export const getAllTokens = async (): Promise<Array<{
  id: string;
  token: string;
  userId: string;
  username: string;
  description: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  source: string;
  isExpired: boolean;
  timeRemaining: number;
  isCurrentToken: boolean;
  revokedAt?: string;
  revokedBy?: string;
}>> => {
  return fetchAPI('/auth/tokens');
};

export const revokeToken = async (tokenId: string): Promise<{
  message: string;
  revokedToken: {
    id: string;
    description: string;
    createdAt: string;
  };
}> => {
  return fetchAPI(`/auth/tokens/${tokenId}`, {
    method: 'DELETE',
  });
};

export const cleanupExpiredTokens = async (): Promise<{
  message: string;
  cleanedCount: number;
}> => {
  return fetchAPI('/auth/tokens/cleanup', {
    method: 'DELETE',
  });
};

export const deleteToken = async (tokenId: string): Promise<{
  message: string;
  deletedToken: {
    id: string;
    description: string;
    createdAt: string;
  };
}> => {
  return fetchAPI(`/auth/tokens/${tokenId}/permanent`, {
    method: 'DELETE',
  });
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

// 快捷记录相关API
export const createQuickRecord = async (keyword: string): Promise<{
  message: string;
  record: UsageRecord;
  card: MemberCard;
  keyword: string;
}> => {
  return fetchAPI('/records/quick', {
    method: 'POST',
    body: JSON.stringify({ keyword }),
  });
}; 