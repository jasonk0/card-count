import { MemberCard, UsageRecord } from '../types';

// 本地存储键名
const CARDS_STORAGE_KEY = 'memberCards';
const USAGE_STORAGE_KEY = 'usageRecords';

// 获取会员卡列表
export const getCards = (): MemberCard[] => {
  const cardsJson = localStorage.getItem(CARDS_STORAGE_KEY);
  return cardsJson ? JSON.parse(cardsJson) : [];
};

// 保存会员卡列表
export const saveCards = (cards: MemberCard[]): void => {
  localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
};

// 添加会员卡
export const addCard = (card: MemberCard): void => {
  const cards = getCards();
  cards.push(card);
  saveCards(cards);
};

// 更新会员卡
export const updateCard = (updatedCard: MemberCard): void => {
  const cards = getCards();
  const index = cards.findIndex(card => card.id === updatedCard.id);
  if (index !== -1) {
    cards[index] = updatedCard;
    saveCards(cards);
  }
};

// 删除会员卡
export const deleteCard = (cardId: string): void => {
  const cards = getCards();
  const filteredCards = cards.filter(card => card.id !== cardId);
  saveCards(filteredCards);
};

// 获取使用记录
export const getUsageRecords = (): UsageRecord[] => {
  const recordsJson = localStorage.getItem(USAGE_STORAGE_KEY);
  return recordsJson ? JSON.parse(recordsJson) : [];
};

// 保存使用记录
export const saveUsageRecords = (records: UsageRecord[]): void => {
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(records));
};

// 添加使用记录
export const addUsageRecord = (record: UsageRecord): void => {
  const records = getUsageRecords();
  records.push(record);
  saveUsageRecords(records);
};

// 更新使用记录
export const updateUsageRecord = (updatedRecord: UsageRecord): void => {
  const records = getUsageRecords();
  const index = records.findIndex(record => record.id === updatedRecord.id);
  if (index !== -1) {
    records[index] = updatedRecord;
    saveUsageRecords(records);
  }
};

// 删除使用记录
export const deleteUsageRecord = (recordId: string): void => {
  const records = getUsageRecords();
  const filteredRecords = records.filter(record => record.id !== recordId);
  saveUsageRecords(filteredRecords);
};

// 获取指定会员卡的使用记录
export const getCardUsageRecords = (cardId: string): UsageRecord[] => {
  const records = getUsageRecords();
  return records.filter(record => record.cardId === cardId);
};

// 计算指定会员卡的平均使用成本
export const calculateAverageCost = (cardId: string): number => {
  const card = getCards().find(c => c.id === cardId);
  if (!card) return 0;
  
  const records = getCardUsageRecords(cardId);
  const usedCount = records.filter(r => r.isUsed).length;
  
  if (usedCount === 0) return 0;
  
  // 计算从售出门票获得的收入
  const income = records
    .filter(r => r.isSold && r.soldPrice)
    .reduce((sum, record) => sum + (record.soldPrice || 0), 0);
  
  // 假设卡的成本是固定的（这里可以根据实际情况修改）
  const cardCost = 0; // 需要从卡信息中获取实际成本
  
  return (cardCost - income) / usedCount;
}; 