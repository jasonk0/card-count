import { useState, useEffect } from 'react';
import { UsageRecord } from '../types';
import * as api from '../api';

export const useUsageRecords = () => {
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 从API加载数据
    const loadRecords = async () => {
      try {
        setLoading(true);
        const loadedRecords = await api.fetchRecords();
        setRecords(loadedRecords);
        setError(null);
      } catch (err) {
        console.error('加载使用记录失败:', err);
        setError('加载使用记录失败');
      } finally {
        setLoading(false);
      }
    };
    
    loadRecords();
  }, []);

  // 添加使用记录
  const addRecord = async (recordData: Omit<UsageRecord, 'id'>) => {
    try {
      setLoading(true);
      const newRecord = await api.createRecord(recordData);
      setRecords((prevRecords: UsageRecord[]) => [...prevRecords, newRecord]);
      setError(null);
      return newRecord;
    } catch (err) {
      console.error('添加使用记录失败:', err);
      setError('添加使用记录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 批量添加使用记录
  const batchAddRecords = async (recordsData: Omit<UsageRecord, 'id'>[]) => {
    try {
      setLoading(true);
      const newRecords = await api.batchCreateRecords(recordsData);
      
      // 更新状态
      setRecords((prevRecords: UsageRecord[]) => [...prevRecords, ...newRecords]);
      
      setError(null);
      return newRecords;
    } catch (err) {
      console.error('批量添加使用记录失败:', err);
      setError('批量添加使用记录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 更新使用记录
  const updateRecord = async (updatedRecord: UsageRecord) => {
    try {
      setLoading(true);
      const result = await api.updateRecord(updatedRecord);
      
      setRecords((prevRecords: UsageRecord[]) => 
        prevRecords.map((record: UsageRecord) => 
          record.id === result.id ? result : record
        )
      );
      
      setError(null);
      return result;
    } catch (err) {
      console.error('更新使用记录失败:', err);
      setError('更新使用记录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // 批量更新使用记录
  const batchUpdateRecords = async (updatedRecords: UsageRecord[]) => {
    try {
      setLoading(true);
      const results = await api.batchUpdateRecords(updatedRecords);
      
      // 创建ID到更新记录的映射
      const updatesById = new Map(results.map(record => [record.id, record]));
      
      // 更新状态
      setRecords(prev => prev.map(record => 
        updatesById.has(record.id) ? updatesById.get(record.id)! : record
      ));
      
      setError(null);
      return results;
    } catch (err) {
      console.error('批量更新使用记录失败:', err);
      setError('批量更新使用记录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 删除使用记录
  const removeRecord = async (recordId: string) => {
    try {
      setLoading(true);
      await api.deleteRecord(recordId);
      
      setRecords((prevRecords: UsageRecord[]) => 
        prevRecords.filter((record: UsageRecord) => record.id !== recordId)
      );
      
      setError(null);
    } catch (err) {
      console.error('删除使用记录失败:', err);
      setError('删除使用记录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // 批量删除使用记录
  const batchRemoveRecords = async (recordIds: string[]) => {
    try {
      setLoading(true);
      await api.batchDeleteRecords(recordIds);
      
      // 更新状态
      setRecords(prev => prev.filter(record => !recordIds.includes(record.id)));
      
      setError(null);
    } catch (err) {
      console.error('批量删除使用记录失败:', err);
      setError('批量删除使用记录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 获取特定会员卡的使用记录
  const getRecordsByCardId = (cardId: string) => {
    return records.filter((record: UsageRecord) => record.cardId === cardId);
  };
  
  // 计算会员卡的平均使用成本
  const calculateCardUsageCost = (cardId: string, cardPrice: number) => {
    const cardRecords = getRecordsByCardId(cardId);
    const usageCount = cardRecords.filter((record: UsageRecord) => record.isUsed).length;
    
    if (usageCount === 0) return 0;
    
    // 计算从售出门票获得的收入
    const income = cardRecords
      .filter((record: UsageRecord) => record.isSold && record.soldPrice)
      .reduce((total, record) => total + (record.soldPrice || 0), 0);
    
    // 实际成本 = 卡价格 - 售票收入
    const actualCost = cardPrice - income;
    
    return actualCost / usageCount;
  };

  return {
    records,
    loading,
    error,
    addRecord,
    batchAddRecords,
    updateRecord,
    batchUpdateRecords,
    removeRecord,
    batchRemoveRecords,
    getRecordsByCardId,
    calculateCardUsageCost
  };
}; 