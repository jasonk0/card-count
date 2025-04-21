import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MemberCard, PauseRecord } from '../types';
import { differenceInDays, addDays, format, isWithinInterval, parseISO, isAfter } from 'date-fns';
import * as api from '../api';

export const useCards = () => {
  const [cards, setCards] = useState<MemberCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 从API加载数据
    const loadCards = async () => {
      try {
        setLoading(true);
        const loadedCards = await api.fetchCards();
        
        // 检查每张卡的状态（是否在暂停期内）
        const updatedCards = loadedCards.map(card => ({
          ...card,
          isActive: !isCardPaused(card)
        }));
        
        setCards(updatedCards);
        setError(null);
      } catch (err) {
        console.error('加载会员卡失败:', err);
        setError('加载会员卡失败');
      } finally {
        setLoading(false);
      }
    };
    
    loadCards();
  }, []);
  
  // 检查卡片是否在暂停期内
  const isCardPaused = (card: MemberCard): boolean => {
    const today = new Date();
    
    // 确保pauseHistory存在
    if (!card.pauseHistory) {
      return false;
    }
    
    // 检查是否有未结束的暂停记录或当前日期在暂停日期范围内的记录
    return card.pauseHistory.some(pause => {
      const pauseStart = parseISO(pause.startDate);
      
      // 如果没有结束日期（无限期暂停）且今天在开始日期之后
      if (!pause.endDate && isAfter(today, pauseStart)) {
        return true;
      }
      
      // 如果有结束日期，检查今天是否在暂停范围内
      if (pause.endDate) {
        const pauseEnd = parseISO(pause.endDate);
        return isWithinInterval(today, { start: pauseStart, end: pauseEnd });
      }
      
      return false;
    });
  };

  // 创建新会员卡
  const createCard = async (cardData: Omit<MemberCard, 'id' | 'pauseHistory'>) => {
    try {
      setLoading(true);
      const newCard = await api.createCard(cardData);
      
      // 确保卡具有isActive属性
      const finalCard = {
        ...newCard,
        isActive: !isCardPaused(newCard)
      };
      
      setCards((prevCards: MemberCard[]) => [...prevCards, finalCard]);
      setError(null);
      return finalCard;
    } catch (err) {
      console.error('创建会员卡失败:', err);
      setError('创建会员卡失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 修改会员卡
  const editCard = async (updatedCard: MemberCard) => {
    try {
      setLoading(true);
      const result = await api.updateCard(updatedCard);
      
      // 确保卡具有isActive属性
      const finalCard = {
        ...result,
        isActive: !isCardPaused(result)
      };
      
      setCards((prevCards: MemberCard[]) => 
        prevCards.map((card: MemberCard) => 
          card.id === finalCard.id ? finalCard : card
        )
      );
      setError(null);
      return finalCard;
    } catch (err) {
      console.error('修改会员卡失败:', err);
      setError('修改会员卡失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 批量修改会员卡
  const batchEditCards = async (updatedCards: MemberCard[]) => {
    try {
      setLoading(true);
      const result = await api.batchUpdateCards(updatedCards);
      
      // 确保每张卡具有isActive属性
      const finalCards = result.map(card => ({
        ...card,
        isActive: !isCardPaused(card)
      }));
      
      // 更新状态
      setCards((prevCards: MemberCard[]) => 
        prevCards.map((card: MemberCard) => {
          const updatedCard = finalCards.find(c => c.id === card.id);
          return updatedCard || card;
        })
      );
      setError(null);
      return finalCards;
    } catch (err) {
      console.error('批量修改会员卡失败:', err);
      setError('批量修改会员卡失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 删除会员卡
  const removeCard = async (cardId: string) => {
    try {
      setLoading(true);
      await api.deleteCard(cardId);
      setCards((prevCards: MemberCard[]) => prevCards.filter((card: MemberCard) => card.id !== cardId));
      setError(null);
    } catch (err) {
      console.error('删除会员卡失败:', err);
      setError('删除会员卡失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 暂停会员卡
  const pauseCard = async (cardId: string, pauseData: Omit<PauseRecord, 'id'>) => {
    try {
      setLoading(true);
      const card = cards.find((c: MemberCard) => c.id === cardId);
      if (!card) {
        throw new Error('未找到会员卡');
      }

      const pauseRecord: PauseRecord = {
        ...pauseData,
        id: uuidv4()
      };

      // 计算暂停天数及新的结束日期
      let newEndDate = card.endDate;
      if (pauseData.endDate) {
        // 如果提供了预计结束日期，计算暂停的天数
        const pauseDays = differenceInDays(
          new Date(pauseData.endDate),
          new Date(pauseData.startDate)
        );
        
        // 延长卡的结束日期
        if (pauseDays > 0) {
          newEndDate = format(
            addDays(new Date(card.endDate), pauseDays),
            'yyyy-MM-dd'
          );
        }
      }

      const updatedCard: MemberCard = {
        ...card,
        endDate: newEndDate,
        pauseHistory: [...(card.pauseHistory || []), pauseRecord]
      };
      
      // 更新卡的状态
      updatedCard.isActive = !isCardPaused(updatedCard);

      const result = await api.updateCard(updatedCard);
      
      // 确保返回的卡有正确的isActive状态
      const finalCard = {
        ...result,
        isActive: !isCardPaused(result)
      };
      
      setCards((prevCards: MemberCard[]) => 
        prevCards.map((card: MemberCard) => 
          card.id === cardId ? finalCard : card
        )
      );
      setError(null);
      return finalCard;
    } catch (err) {
      console.error('暂停会员卡失败:', err);
      setError('暂停会员卡失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 恢复会员卡
  const resumeCard = async (cardId: string, pauseId: string, resumeDate: string) => {
    try {
      setLoading(true);
      const card = cards.find((c: MemberCard) => c.id === cardId);
      if (!card) {
        throw new Error('未找到会员卡');
      }
      
      // 找到对应的暂停记录
      const pauseIndex = card.pauseHistory.findIndex(p => p.id === pauseId);
      if (pauseIndex === -1) {
        throw new Error('未找到暂停记录');
      }
      
      // 创建更新后的暂停记录
      const updatedPauseHistory = [...card.pauseHistory];
      updatedPauseHistory[pauseIndex] = {
        ...updatedPauseHistory[pauseIndex],
        endDate: resumeDate
      };
      
      // 如果提前恢复，需要调整卡的结束日期
      let newEndDate = card.endDate;
      const pauseRecord = card.pauseHistory[pauseIndex];
      
      if (pauseRecord.endDate) {
        // 计算原计划暂停的天数
        const originalPauseDays = differenceInDays(
          new Date(pauseRecord.endDate),
          new Date(pauseRecord.startDate)
        );
        
        // 计算实际暂停的天数
        const actualPauseDays = differenceInDays(
          new Date(resumeDate),
          new Date(pauseRecord.startDate)
        );
        
        // 如果提前恢复，需要调整卡的结束日期
        if (actualPauseDays < originalPauseDays) {
          const daysDifference = originalPauseDays - actualPauseDays;
          newEndDate = format(
            addDays(new Date(card.endDate), -daysDifference),
            'yyyy-MM-dd'
          );
        }
      }
      
      const updatedCard: MemberCard = {
        ...card,
        endDate: newEndDate,
        pauseHistory: updatedPauseHistory
      };
      
      // 更新卡的状态
      updatedCard.isActive = !isCardPaused(updatedCard);
      
      const result = await api.updateCard(updatedCard);
      
      // 确保返回的卡有正确的isActive状态
      const finalCard = {
        ...result,
        isActive: !isCardPaused(result)
      };
      
      setCards((prevCards: MemberCard[]) => 
        prevCards.map((card: MemberCard) => 
          card.id === cardId ? finalCard : card
        )
      );
      setError(null);
      return finalCard;
    } catch (err) {
      console.error('恢复会员卡失败:', err);
      setError('恢复会员卡失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 编辑暂停记录
  const editPauseRecord = async (cardId: string, updatedPause: PauseRecord) => {
    try {
      setLoading(true);
      const card = cards.find((c: MemberCard) => c.id === cardId);
      if (!card) {
        throw new Error('未找到会员卡');
      }
      
      // 找到需要编辑的暂停记录
      const pauseIndex = card.pauseHistory.findIndex(p => p.id === updatedPause.id);
      if (pauseIndex === -1) {
        throw new Error('未找到暂停记录');
      }
      
      // 创建更新后的暂停记录数组
      const updatedPauseHistory = [...card.pauseHistory];
      updatedPauseHistory[pauseIndex] = updatedPause;
      
      const updatedCard: MemberCard = {
        ...card,
        pauseHistory: updatedPauseHistory
      };
      
      // 更新卡的状态
      updatedCard.isActive = !isCardPaused(updatedCard);
      
      const result = await api.updateCard(updatedCard);
      
      // 确保返回的卡有正确的isActive状态
      const finalCard = {
        ...result,
        isActive: !isCardPaused(result)
      };
      
      setCards((prevCards: MemberCard[]) => 
        prevCards.map((card: MemberCard) => 
          card.id === cardId ? finalCard : card
        )
      );
      setError(null);
      return finalCard;
    } catch (err) {
      console.error('编辑暂停记录失败:', err);
      setError('编辑暂停记录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 删除暂停记录
  const deletePauseRecord = async (cardId: string, pauseId: string) => {
    try {
      setLoading(true);
      const card = cards.find((c: MemberCard) => c.id === cardId);
      if (!card) {
        throw new Error('未找到会员卡');
      }
      
      // 过滤掉要删除的暂停记录
      const updatedPauseHistory = card.pauseHistory.filter(p => p.id !== pauseId);
      
      const updatedCard: MemberCard = {
        ...card,
        pauseHistory: updatedPauseHistory
      };
      
      // 更新卡的状态
      updatedCard.isActive = !isCardPaused(updatedCard);
      
      const result = await api.updateCard(updatedCard);
      
      // 确保返回的卡有正确的isActive状态
      const finalCard = {
        ...result,
        isActive: !isCardPaused(result)
      };
      
      setCards((prevCards: MemberCard[]) => 
        prevCards.map((card: MemberCard) => 
          card.id === cardId ? finalCard : card
        )
      );
      setError(null);
      return finalCard;
    } catch (err) {
      console.error('删除暂停记录失败:', err);
      setError('删除暂停记录失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    cards,
    loading,
    error,
    createCard,
    editCard,
    batchEditCards,
    removeCard,
    pauseCard,
    resumeCard,
    isCardPaused,
    editPauseRecord,
    deletePauseRecord
  };
}; 