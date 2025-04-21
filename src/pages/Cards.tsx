import { useState, useEffect } from 'react';
import { format, differenceInDays, addDays, isAfter } from 'date-fns';
import { useCards } from '../hooks/useCards';
import { MemberCard, PauseRecord } from '../types';

export default function Cards() {
  const { 
    cards, 
    loading, 
    createCard, 
    removeCard, 
    pauseCard, 
    resumeCard, 
    editPauseRecord, 
    deletePauseRecord,
    editCard,
    batchEditCards
  } = useCards();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isEditPauseModalOpen, setIsEditPauseModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<MemberCard | null>(null);
  const [selectedPause, setSelectedPause] = useState<PauseRecord | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    totalDays: 0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    price: 0,
    expectedPricePerUse: 0,
    isActive: true,
    remainingDays:0,
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    type: '',
    totalDays: 0,
    startDate: '',
    endDate: '',
    price: 0,
    expectedPricePerUse: 0,
    remainingDays: 0
  });
  
  const [batchEditFormData, setBatchEditFormData] = useState({
    type: '',
    addDays: 0,
    addRemainingDays: 0,
    applyType: false,
    applyDays: false,
    applyRemainingDays: false
  });
  
  const [pauseData, setPauseData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    reason: '',
  });
  
  const [editPauseData, setEditPauseData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  // 使用useEffect在每次进入页面时更新会员卡的剩余时间
  useEffect(() => {
    if (!loading && cards.length > 0) {
      const today = new Date();
      const updatedCards = cards.map(card => {
        // 如果卡已暂停，不更新剩余天数
        if (!card.isActive) return card;
        
        // 计算从当前日期到结束日期的剩余天数，需要排除暂停的时间
        const endDate = new Date(card.endDate);
        const totalDaysLeft = differenceInDays(endDate, today);
        
        // 计算当前日期到未来的暂停天数
        let futurePauseDays = 0;
        
        // 遍历所有暂停记录
        card.pauseHistory.forEach(pause => {
          const pauseStart = new Date(pause.startDate);
          
          // 只处理未来的暂停
          if (isAfter(pauseStart, today)) {
            const pauseEnd = pause.endDate ? new Date(pause.endDate) : endDate;
            // 计算这段暂停的天数
            const pauseDuration = differenceInDays(pauseEnd, pauseStart);
            futurePauseDays += Math.max(0, pauseDuration);
          } 
          // 处理当前正在进行中但未结束的暂停
          else if (!pause.endDate || isAfter(new Date(pause.endDate), today)) {
            // 对于当前正在暂停的卡片，不应该进入这个分支，因为isActive已经是false
            return;
          }
        });
        
        // 真实剩余天数 = 总剩余天数 - 未来的暂停天数
        const remainingDays = Math.max(0, totalDaysLeft - futurePauseDays);
        
        // 只有当计算出的剩余天数与卡上的剩余天数不同时才更新
        if (remainingDays !== card.remainingDays) {
          const updatedCard = {
            ...card,
            remainingDays // 确保剩余天数不为负数
          };
          // 更新卡片
          editCard(updatedCard);
          return updatedCard;
        }
        
        return card;
      });
    }
  }, [cards, loading, editCard]);

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'totalDays') {
      // 自动计算结束日期，考虑计划的暂停天数
      const startDate = new Date(formData.startDate);
      const totalDaysValue = name === 'totalDays' ? parseInt(value) : formData.totalDays;
      
      // 计算所有预期暂停的总天数 - 这里因为是新建会员卡，暂时还没有暂停记录
      const pauseDaysTotal = 0; // 新卡没有暂停记录
      
      // 结束日期 = 开始日期 + 总天数（包含暂停时间）
      const endDate = addDays(startDate, totalDaysValue);
      
      // 计算剩余天数时，扣除暂停时间
      const totalDaysLeft = differenceInDays(endDate, new Date());
      const remainingDays = Math.max(0, totalDaysLeft - pauseDaysTotal);

      setFormData({
        ...formData,
        remainingDays,
        [name]: parseInt(value),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });
    } else if (name === 'startDate') {
      // 更新开始日期时，同时更新结束日期
      const startDate = new Date(value);
      
      // 结束日期 = 开始日期 + 总天数
      const endDate = addDays(startDate, formData.totalDays);
      
      // 计算剩余天数
      const totalDaysLeft = differenceInDays(endDate, new Date());
      const remainingDays = Math.max(0, totalDaysLeft);

      setFormData({
        ...formData,
        remainingDays,
        [name]: value,
        endDate: format(endDate, 'yyyy-MM-dd'),
      });
    } else if (name === 'price' || name === 'expectedPricePerUse') {
      // 处理价格相关字段
      setFormData({
        ...formData,
        [name]: parseFloat(value),
      });
    } else {
      // 处理其他字段（name, type等）
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  // 处理编辑表单输入变化
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'totalDays') {
      // 自动计算结束日期和剩余天数
      const startDate = new Date(editFormData.startDate);
      const totalDays = parseInt(value);
      
      // 计算所有预期暂停的总天数（如果有暂停记录）
      let pauseDaysTotal = 0;
      
      if (selectedCard) {
        // 遍历所有暂停记录，计算总暂停天数
        selectedCard.pauseHistory.forEach(pause => {
          if (pause.endDate) {
            // 已结束的暂停
            const pauseDuration = differenceInDays(
              new Date(pause.endDate),
              new Date(pause.startDate)
            );
            pauseDaysTotal += Math.max(0, pauseDuration);
          } else {
            // 未结束的暂停（正在进行中）
            const today = new Date();
            const pauseStart = new Date(pause.startDate);
            if (isAfter(today, pauseStart)) {
              // 如果暂停开始日期在今天之前
              const pauseDuration = differenceInDays(today, pauseStart);
              pauseDaysTotal += Math.max(0, pauseDuration);
            }
          }
        });
      }
      
      // 结束日期 = 开始日期 + 总天数
      const endDate = addDays(startDate, totalDays);
      
      // 计算剩余天数
      const today = new Date();
      const totalDaysLeft = differenceInDays(endDate, today);
      
      // 计算未来的暂停天数
      let futurePauseDays = 0;
      if (selectedCard) {
        selectedCard.pauseHistory.forEach(pause => {
          const pauseStart = new Date(pause.startDate);
          
          // 只处理未来的暂停
          if (isAfter(pauseStart, today)) {
            const pauseEnd = pause.endDate ? new Date(pause.endDate) : endDate;
            const pauseDuration = differenceInDays(pauseEnd, pauseStart);
            futurePauseDays += Math.max(0, pauseDuration);
          }
        });
      }
      
      // 剩余天数 = 总剩余天数 - 未来暂停天数
      const remainingDays = Math.max(0, totalDaysLeft - futurePauseDays);
      
      setEditFormData({
        ...editFormData,
        totalDays,
        endDate: format(endDate, 'yyyy-MM-dd'),
        remainingDays
      });
    } else if (name === 'startDate') {
      // 更新开始日期时，同时更新结束日期
      const startDate = new Date(value);
      const endDate = addDays(startDate, editFormData.totalDays);
      
      // 计算剩余天数
      const today = new Date();
      const totalDaysLeft = differenceInDays(endDate, today);
      
      // 计算未来的暂停天数
      let futurePauseDays = 0;
      if (selectedCard) {
        selectedCard.pauseHistory.forEach(pause => {
          const pauseStart = new Date(pause.startDate);
          
          // 只处理未来的暂停
          if (isAfter(pauseStart, today)) {
            const pauseEnd = pause.endDate ? new Date(pause.endDate) : endDate;
            const pauseDuration = differenceInDays(pauseEnd, pauseStart);
            futurePauseDays += Math.max(0, pauseDuration);
          }
        });
      }
      
      // 剩余天数 = 总剩余天数 - 未来暂停天数
      const remainingDays = Math.max(0, totalDaysLeft - futurePauseDays);
      
      setEditFormData({
        ...editFormData,
        startDate: value,
        endDate: format(endDate, 'yyyy-MM-dd'),
        remainingDays
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: name === 'price' || name === 'expectedPricePerUse' ? parseFloat(value) : value,
      });
    }
  };

  // 处理批量编辑表单变更
  const handleBatchEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setBatchEditFormData({
        ...batchEditFormData,
        [name]: checked
      });
    } else {
      setBatchEditFormData({
        ...batchEditFormData,
        [name]: value
      });
    }
  };
  
  // 切换卡片选择状态
  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        return [...prev, cardId];
      }
    });
  };
  
  // 切换全选状态
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedCards([]);
    } else {
      setSelectedCards(cards.map(card => card.id));
    }
    setSelectAll(!selectAll);
  };
  
  // 打开批量编辑模态框
  const openBatchEditModal = () => {
    if (selectedCards.length === 0) {
      alert('请先选择要批量编辑的会员卡');
      return;
    }
    
    setBatchEditFormData({
      type: '',
      addDays: 0,
      addRemainingDays: 0,
      applyType: false,
      applyDays: false,
      applyRemainingDays: false
    });
    
    setIsBatchEditModalOpen(true);
  };
  
  // 提交批量编辑
  const handleBatchEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 过滤出选中的卡
    const cardsToUpdate = cards.filter(card => selectedCards.includes(card.id));
    
    // 应用批量更新
    const updatedCards = cardsToUpdate.map(card => {
      const updated = { ...card };
      
      // 应用类型更改
      if (batchEditFormData.applyType && batchEditFormData.type) {
        updated.type = batchEditFormData.type;
      }
      
      // 应用天数增加
      if (batchEditFormData.applyDays && batchEditFormData.addDays) {
        const addDaysValue = parseInt(batchEditFormData.addDays.toString());
        updated.totalDays += addDaysValue;
        // 同时更新结束日期
        const endDate = addDays(new Date(updated.endDate), addDaysValue);
        updated.endDate = format(endDate, 'yyyy-MM-dd');
      }
      
      // 应用剩余天数增加
      if (batchEditFormData.applyRemainingDays && batchEditFormData.addRemainingDays) {
        const addRemainingDaysValue = parseInt(batchEditFormData.addRemainingDays.toString());
        updated.remainingDays += addRemainingDaysValue;
        // 确保剩余天数不超过总天数
        updated.remainingDays = Math.min(updated.remainingDays, updated.totalDays);
      }
      
      return updated;
    });
    
    // 保存批量更新
    batchEditCards(updatedCards);
    
    // 清空选择并关闭模态框
    setSelectedCards([]);
    setSelectAll(false);
    setIsBatchEditModalOpen(false);
  };

  // 提交新会员卡
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createCard({
      name: formData.name,
      type: formData.type,
      totalDays: formData.totalDays,
      remainingDays: formData.remainingDays,
      startDate: formData.startDate,
      endDate: formData.endDate,
      isActive: true,
      expectedPricePerUse:formData.expectedPricePerUse,
      price: formData.price
    });
    
    // 重置表单并关闭模态框
    setFormData({
      name: '',
      type: '',
      totalDays: 90,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      price: 0,
      expectedPricePerUse: 0,
      isActive: true,
      remainingDays: 0
    });
    setIsAddModalOpen(false);
  };
  
  // 打开编辑卡信息模态框
  const openEditModal = (card: MemberCard) => {
    setSelectedCard(card);
    setEditFormData({
      name: card.name,
      type: card.type,
      totalDays: card.totalDays,
      remainingDays: card.remainingDays,
      startDate: card.startDate,
      endDate: card.endDate,
      price: card.price || 0,
      expectedPricePerUse: card.expectedPricePerUse || 0
    });
    setIsEditModalOpen(true);
  };
  
  // 提交编辑会员卡
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCard) {
      const updatedCard: MemberCard = {
        ...selectedCard,
        name: editFormData.name,
        type: editFormData.type,
        totalDays: editFormData.totalDays,
        remainingDays: editFormData.remainingDays,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
        price: editFormData.price,
        expectedPricePerUse: editFormData.expectedPricePerUse
      };
      
      editCard(updatedCard);
      setIsEditModalOpen(false);
    }
  };

  // 打开暂停卡模态框
  const openPauseModal = (card: MemberCard) => {
    setSelectedCard(card);
    setIsPauseModalOpen(true);
  };

  // 提交暂停请求
  const handlePauseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCard) {
      pauseCard(selectedCard.id, {
        startDate: pauseData.startDate,
        endDate: pauseData.endDate || null,
        reason: pauseData.reason,
      });
      
      // 重置表单并关闭模态框
      setPauseData({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        reason: '',
      });
      setIsPauseModalOpen(false);
    }
  };

  // 恢复卡
  const handleResumeCard = (cardId: string, pauseId: string) => {
    resumeCard(cardId, pauseId, format(new Date(), 'yyyy-MM-dd'));
  };
  
  // 打开编辑暂停记录模态框
  const openEditPauseModal = (card: MemberCard, pause: PauseRecord) => {
    setSelectedCard(card);
    setSelectedPause(pause);
    setEditPauseData({
      startDate: pause.startDate,
      endDate: pause.endDate || '',
      reason: pause.reason,
    });
    setIsEditPauseModalOpen(true);
  };
  
  // 提交编辑暂停记录
  const handleEditPauseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCard && selectedPause) {
      editPauseRecord(selectedCard.id, {
        id: selectedPause.id,
        startDate: editPauseData.startDate,
        endDate: editPauseData.endDate || null,
        reason: editPauseData.reason,
      });
      
      // 重置表单并关闭模态框
      setEditPauseData({
        startDate: '',
        endDate: '',
        reason: '',
      });
      setIsEditPauseModalOpen(false);
    }
  };
  
  // 删除暂停记录
  const handleDeletePauseRecord = (cardId: string, pauseId: string) => {
    if (confirm('确定要删除这条暂停记录吗？')) {
      deletePauseRecord(cardId, pauseId);
    }
  };

  if (loading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">会员卡管理</h2>
        <div className="flex space-x-2">
          {selectedCards.length > 0 && (
            <button
              onClick={openBatchEditModal}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              批量修改({selectedCards.length})
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            添加会员卡
          </button>
        </div>
      </div>

      {/* 会员卡选择和批量操作 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="select-all"
            checked={selectAll}
            onChange={toggleSelectAll}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="select-all" className="ml-2 text-sm text-gray-700">
            全选
          </label>
          <span className="ml-2 text-xs text-gray-500">
            (已选择 {selectedCards.length} 张卡)
          </span>
        </div>
      </div>

      {/* 会员卡列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCards.includes(card.id)}
                    onChange={() => toggleCardSelection(card.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{card.name}</h3>
                  </div>
                  <span className="m-2 text-sm text-gray-500">{card.type}</span>

                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    card.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {card.isActive ? '激活' : '暂停'}
                </span>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">总天数:</span>
                  <span className="text-sm font-medium">{card.totalDays}天</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">剩余天数:</span>
                  <span className="text-sm font-medium">{card.remainingDays}天</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">开始日期:</span>
                  <span className="text-sm font-medium">
                    {new Date(card.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">结束日期:</span>
                  <span className="text-sm font-medium">
                    {new Date(card.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">价格:</span>
                  <span className="text-sm font-medium">
                    {card.price ? `¥${card.price.toFixed(2)}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">预期单次价格:</span>
                  <span className="text-sm font-medium">
                    {card.expectedPricePerUse ? `¥${card.expectedPricePerUse.toFixed(2)}` : '-'}
                  </span>
                </div>
              </div>

              {/* 暂停历史记录 */}
              {card.pauseHistory.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">暂停记录:</h4>
                  <ul className="text-xs text-gray-500 space-y-1">
                    {card.pauseHistory.map((pause) => (
                      <li key={pause.id} className="flex justify-between">
                        <span>
                          {new Date(pause.startDate).toLocaleDateString()} 至 
                          {pause.endDate ? new Date(pause.endDate).toLocaleDateString() : '进行中'}
                          {pause.reason ? ` (${pause.reason})` : ''}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditPauseModal(card, pause)}
                            className="min-w-7 text-blue-600 hover:text-blue-800"
                          >
                            编辑
                          </button>
                          {!pause.endDate && (
                            <button
                              onClick={() => handleResumeCard(card.id, pause.id)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              恢复
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePauseRecord(card.id, pause.id)}
                            className="min-w-7 text-red-600 hover:text-red-800"
                          >
                            删除
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="px-5 py-3 bg-gray-50 flex justify-end space-x-4">
              <button
                onClick={() => openEditModal(card)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                编辑
              </button>
              <button
                onClick={() => openPauseModal(card)}
                className="text-sm text-yellow-600 hover:text-yellow-800"
              >
                暂停
              </button>
              {!card.isActive && (
                <button
                  onClick={() => {
                    const activePause = card.pauseHistory.find(p => !p.endDate);
                    if (activePause) {
                      handleResumeCard(card.id, activePause.id);
                    }
                  }}
                  className="text-sm text-green-600 hover:text-green-800"
                >
                  恢复
                </button>
              )}
              <button
                onClick={() => removeCard(card.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                删除
              </button>
            </div>
          </div>
        ))}
        
        {cards.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">暂无会员卡，点击右上角添加</p>
          </div>
        )}
      </div>

      {/* 添加会员卡模态框 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">添加会员卡</h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      卡名称
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      卡类型
                    </label>
                    <input
                      type="text"
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="totalDays" className="block text-sm font-medium text-gray-700">
                      总天数
                    </label>
                    <input
                      type="number"
                      id="totalDays"
                      name="totalDays"
                      value={formData.totalDays}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      开始日期
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      结束日期 (自动计算，含计划暂停)
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      readOnly
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md shadow-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      卡价格 (元)
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="expectedPricePerUse" className="block text-sm font-medium text-gray-700">
                      预期单次价格 (元)
                    </label>
                    <input
                      type="number"
                      id="expectedPricePerUse"
                      name="expectedPricePerUse"
                      value={formData.expectedPricePerUse}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">设置后可查看使用价值和达到预期价格需要的使用次数</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    添加
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 编辑会员卡模态框 */}
      {isEditModalOpen && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">编辑会员卡</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                      卡名称
                    </label>
                    <input
                      type="text"
                      id="edit-name"
                      name="name"
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700">
                      卡类型
                    </label>
                    <input
                      type="text"
                      id="edit-type"
                      name="type"
                      value={editFormData.type}
                      onChange={handleEditInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-totalDays" className="block text-sm font-medium text-gray-700">
                      总天数
                    </label>
                    <input
                      type="number"
                      id="edit-totalDays"
                      name="totalDays"
                      value={editFormData.totalDays}
                      onChange={handleEditInputChange}
                      required
                      min="1"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-startDate" className="block text-sm font-medium text-gray-700">
                      开始日期
                    </label>
                    <input
                      type="date"
                      id="edit-startDate"
                      name="startDate"
                      value={editFormData.startDate}
                      onChange={handleEditInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-endDate" className="block text-sm font-medium text-gray-700">
                      结束日期
                    </label>
                    <input
                      type="date"
                      id="edit-endDate"
                      name="endDate"
                      value={editFormData.endDate}
                      onChange={handleEditInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700">
                      卡价格 (元)
                    </label>
                    <input
                      type="number"
                      id="edit-price"
                      name="price"
                      value={editFormData.price}
                      onChange={handleEditInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-expectedPricePerUse" className="block text-sm font-medium text-gray-700">
                      预期单次价格 (元)
                    </label>
                    <input
                      type="number"
                      id="edit-expectedPricePerUse"
                      name="expectedPricePerUse"
                      value={editFormData.expectedPricePerUse}
                      onChange={handleEditInputChange}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">设置后可查看使用价值和达到预期价格需要的使用次数</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 批量编辑会员卡模态框 */}
      {isBatchEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                批量编辑 ({selectedCards.length} 张卡)
              </h3>
              <form onSubmit={handleBatchEditSubmit}>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="applyType"
                      name="applyType"
                      checked={batchEditFormData.applyType}
                      onChange={handleBatchEditInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="applyType" className="ml-2 block text-sm font-medium text-gray-700">
                      修改卡类型
                    </label>
                  </div>
                  
                  {batchEditFormData.applyType && (
                    <div>
                      <input
                        type="text"
                        id="type"
                        name="type"
                        value={batchEditFormData.type}
                        onChange={handleBatchEditInputChange}
                        placeholder="新卡类型"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="applyDays"
                      name="applyDays"
                      checked={batchEditFormData.applyDays}
                      onChange={handleBatchEditInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="applyDays" className="ml-2 block text-sm font-medium text-gray-700">
                      增加总天数
                    </label>
                  </div>
                  
                  {batchEditFormData.applyDays && (
                    <div>
                      <input
                        type="number"
                        id="addDays"
                        name="addDays"
                        value={batchEditFormData.addDays}
                        onChange={handleBatchEditInputChange}
                        placeholder="增加的天数"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                  
                 
                  
                  {batchEditFormData.applyRemainingDays && (
                    <div>
                      <input
                        type="number"
                        id="addRemainingDays"
                        name="addRemainingDays"
                        value={batchEditFormData.addRemainingDays}
                        onChange={handleBatchEditInputChange}
                        placeholder="增加的剩余天数"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsBatchEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    应用到所选卡片
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 暂停卡模态框 */}
      {isPauseModalOpen && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                暂停会员卡: {selectedCard.name}
              </h3>
              <form onSubmit={handlePauseSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="pauseStartDate" className="block text-sm font-medium text-gray-700">
                      暂停开始日期
                    </label>
                    <input
                      type="date"
                      id="pauseStartDate"
                      name="startDate"
                      value={pauseData.startDate}
                      onChange={(e) => setPauseData({ ...pauseData, startDate: e.target.value })}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="pauseEndDate" className="block text-sm font-medium text-gray-700">
                      预计恢复日期 (不设置则无限期暂停)
                    </label>
                    <input
                      type="date"
                      id="pauseEndDate"
                      name="endDate"
                      value={pauseData.endDate}
                      onChange={(e) => setPauseData({ ...pauseData, endDate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="pauseReason" className="block text-sm font-medium text-gray-700">
                      暂停原因
                    </label>
                    <textarea
                      id="pauseReason"
                      name="reason"
                      value={pauseData.reason}
                      onChange={(e) => setPauseData({ ...pauseData, reason: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsPauseModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    确认暂停
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 编辑暂停记录模态框 */}
      {isEditPauseModalOpen && selectedCard && selectedPause && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                编辑暂停记录
              </h3>
              <form onSubmit={handleEditPauseSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="editPauseStartDate" className="block text-sm font-medium text-gray-700">
                      暂停开始日期
                    </label>
                    <input
                      type="date"
                      id="editPauseStartDate"
                      name="startDate"
                      value={editPauseData.startDate}
                      onChange={(e) => setEditPauseData({ ...editPauseData, startDate: e.target.value })}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="editPauseEndDate" className="block text-sm font-medium text-gray-700">
                      预计恢复日期 (不设置则无限期暂停)
                    </label>
                    <input
                      type="date"
                      id="editPauseEndDate"
                      name="endDate"
                      value={editPauseData.endDate}
                      onChange={(e) => setEditPauseData({ ...editPauseData, endDate: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="editPauseReason" className="block text-sm font-medium text-gray-700">
                      暂停原因
                    </label>
                    <textarea
                      id="editPauseReason"
                      name="reason"
                      value={editPauseData.reason}
                      onChange={(e) => setEditPauseData({ ...editPauseData, reason: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditPauseModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    保存修改
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 