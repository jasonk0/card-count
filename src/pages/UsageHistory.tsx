import { useState } from 'react';
import { useCards } from '../hooks/useCards';
import { useUsageRecords } from '../hooks/useUsageRecords';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { UsageRecord } from '../types';

export default function UsageHistory() {
  const { cards, loading: cardsLoading } = useCards();
  const { 
    records, 
    loading: recordsLoading, 
    addRecord, 
    updateRecord, 
    removeRecord, 
    batchAddRecords,
    batchUpdateRecords,
    batchRemoveRecords
  } = useUsageRecords();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchAddModalOpen, setIsBatchAddModalOpen] = useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);
  const [isBatchCopyModalOpen, setIsBatchCopyModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UsageRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // 批量选择和操作状态
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // 批量添加表单状态
  const [batchFormData, setBatchFormData] = useState({
    cardId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    isUsed: true,
    isSold: false,
    soldPrice: 0,
    notes: '',
  });
  
  // 批量编辑表单状态
  const [batchEditFormData, setBatchEditFormData] = useState({
    cardId: '',
  });
  
  // 批量复制表单状态
  const [batchCopyFormData, setBatchCopyFormData] = useState({
    targetDate: '',
  });
  
  const [formData, setFormData] = useState({
    cardId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    isUsed: true,
    isSold: false,
    soldPrice: 0,
    notes: '',
  });

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  // 处理批量表单输入变化
  const handleBatchInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setBatchFormData({
        ...batchFormData,
        [name]: target.checked,
      });
    } else {
      setBatchFormData({
        ...batchFormData,
        [name]: value,
      });
    }
  };
  
  // 处理批量编辑表单输入变化
  const handleBatchEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBatchEditFormData({
      ...batchEditFormData,
      [name]: value,
    });
  };
  
  // 处理批量复制表单输入变化
  const handleBatchCopyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBatchCopyFormData({
      ...batchCopyFormData,
      [name]: value,
    });
  };
  
  // 切换记录选择状态
  const toggleRecordSelection = (recordId: string) => {
    setSelectedRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };
  
  // 切换全选状态
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map(record => record.id));
    }
    setSelectAll(!selectAll);
  };
  
  // 批量删除选中的记录
  const handleBatchDelete = () => {
    if (selectedRecords.length === 0) return;
    
    if (confirm(`确定要删除选中的 ${selectedRecords.length} 条记录吗？`)) {
      batchRemoveRecords(selectedRecords);
      setSelectedRecords([]);
      setSelectAll(false);
    }
  };

  // 打开批量添加模态框
  const openBatchAddModal = () => {
    setBatchFormData({
      cardId: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      isUsed: true,
      isSold: false,
      soldPrice: 0,
      notes: '',
    });
    setIsBatchAddModalOpen(true);
  };
  
  // 提交批量添加
  const handleBatchAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!batchFormData.cardId) {
      alert('请选择会员卡');
      return;
    }
    
    const startDate = parseISO(batchFormData.startDate);
    const endDate = parseISO(batchFormData.endDate);
    
    // 获取日期范围内的所有日期
    const dates = eachDayOfInterval({ start: startDate, end: endDate });
    
    // 为每个日期创建记录
    const recordsToAdd = dates.map(date => ({
      cardId: batchFormData.cardId,
      date: format(date, 'yyyy-MM-dd'),
      isUsed: batchFormData.isUsed,
      isSold: batchFormData.isSold,
      soldPrice: batchFormData.isSold ? parseFloat(batchFormData.soldPrice.toString()) : null,
      notes: batchFormData.notes,
    }));
    
    batchAddRecords(recordsToAdd);
    
    // 关闭模态框
    setIsBatchAddModalOpen(false);
  };

  // 打开批量编辑模态框
  const openBatchEditModal = () => {
    if (selectedRecords.length === 0) {
      alert('请先选择要批量修改的记录');
      return;
    }
    
    setBatchEditFormData({
      cardId: '',
    });
    
    setIsBatchEditModalOpen(true);
  };
  
  // 提交批量编辑
  const handleBatchEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查是否选择了会员卡
    if (!batchEditFormData.cardId) {
      alert('请选择会员卡');
      return;
    }
    
    // 获取选中的记录
    const recordsToUpdate = records.filter(record => selectedRecords.includes(record.id));
    
    // 批量更新记录，只修改关联会员卡
    const updatedRecords = recordsToUpdate.map(record => ({
      ...record,
      cardId: batchEditFormData.cardId
    }));
    
    // 保存批量更新
    batchUpdateRecords(updatedRecords);
    
    // 关闭模态框
    setIsBatchEditModalOpen(false);
  };

  // 打开批量复制模态框
  const openBatchCopyModal = () => {
    if (selectedRecords.length === 0) {
      alert('请先选择要复制的记录');
      return;
    }
    
    setBatchCopyFormData({
      targetDate: '',
    });
    
    setIsBatchCopyModalOpen(true);
  };
  
  // 提交批量复制
  const handleBatchCopySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 获取选中的记录
    const recordsToCopy = records.filter(record => selectedRecords.includes(record.id));
    
    // 创建复制的记录，如果目标日期为空则使用原记录日期
    const recordsToAdd = recordsToCopy.map(record => ({
      cardId: record.cardId,
      date: batchCopyFormData.targetDate || record.date,
      isUsed: record.isUsed,
      isSold: record.isSold,
      soldPrice: record.soldPrice,
      notes: record.notes,
    }));
    
    // 批量添加复制的记录
    batchAddRecords(recordsToAdd);
    
    // 关闭模态框
    setIsBatchCopyModalOpen(false);
  };

  // 提交新记录
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addRecord({
      cardId: formData.cardId,
      date: formData.date,
      isUsed: formData.isUsed,
      isSold: formData.isSold,
      soldPrice: formData.isSold ? parseFloat(formData.soldPrice.toString()) : null,
      notes: formData.notes,
    });
    
    // 重置表单并关闭模态框
    resetForm();
    setIsAddModalOpen(false);
  };

  // 提交编辑记录
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRecord) {
      updateRecord({
        ...selectedRecord,
        cardId: formData.cardId,
        date: formData.date,
        isUsed: formData.isUsed,
        isSold: formData.isSold,
        soldPrice: formData.isSold ? parseFloat(formData.soldPrice.toString()) : null,
        notes: formData.notes,
      });
      
      // 重置表单并关闭模态框
      resetForm();
      setIsEditModalOpen(false);
    }
  };

  // 打开编辑模态框
  const openEditModal = (record: UsageRecord) => {
    setSelectedRecord(record);
    setFormData({
      cardId: record.cardId,
      date: record.date,
      isUsed: record.isUsed,
      isSold: record.isSold,
      soldPrice: record.soldPrice || 0,
      notes: record.notes,
    });
    setIsEditModalOpen(true);
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      cardId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      isUsed: true,
      isSold: false,
      soldPrice: 0,
      notes: '',
    });
    setSelectedRecord(null);
  };

  if (cardsLoading || recordsLoading) {
    return <div className="p-4">加载中...</div>;
  }

  // 排序记录，最新的在前面
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">使用记录</h2>
        <div className="flex space-x-2">
          <button
            onClick={openBatchAddModal}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            disabled={cards.length === 0}
          >
            批量添加
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            disabled={cards.length === 0}
          >
            添加记录
          </button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {sortedRecords.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
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
            </div>
            <span className="text-sm text-gray-500">
              已选择 {selectedRecords.length} 条记录
            </span>
          </div>
          
          {selectedRecords.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={openBatchCopyModal}
                className="text-sm text-green-600 px-3 py-1 border border-green-300 rounded-md hover:bg-green-50"
              >
                批量复制
              </button>
              <button
                onClick={openBatchEditModal}
                className="text-sm text-blue-600 px-3 py-1 border border-blue-300 rounded-md hover:bg-blue-50"
              >
                批量修改会员卡
              </button>
              <button
                onClick={handleBatchDelete}
                className="text-sm text-red-600 px-3 py-1 border border-red-300 rounded-md hover:bg-red-50"
              >
                批量删除
              </button>
            </div>
          )}
        </div>
      )}

      {/* 记录列表 */}
      {sortedRecords.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {sortedRecords.map((record) => {
              const card = cards.find(c => c.id === record.cardId);
              return (
                <li key={record.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(record.id)}
                        onChange={() => toggleRecordSelection(record.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-3"
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center flex-1">
                        <p className="text-sm font-medium text-indigo-600 sm:mr-4 sm:w-40 truncate">
                          {card?.name || '未知会员卡'}
                        </p>
                        <p className="text-sm text-gray-500 sm:mr-4">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                        <div className="flex mt-1 sm:mt-0">
                          {record.isUsed && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mr-2">
                              已使用
                            </span>
                          )}
                          {record.isSold && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              已售出 ¥{record.soldPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(record)}
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => removeRecord(record.id)}
                        className="text-sm text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  {record.notes && (
                    <p className="mt-2 text-sm text-gray-500 ml-7">
                      备注: {record.notes}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">暂无使用记录，点击右上角添加</p>
        </div>
      )}

      {/* 批量添加记录模态框 */}
      {isBatchAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">批量添加使用记录</h3>
              <form onSubmit={handleBatchAddSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="batch-cardId" className="block text-sm font-medium text-gray-700">
                      选择会员卡
                    </label>
                    <select
                      id="batch-cardId"
                      name="cardId"
                      value={batchFormData.cardId}
                      onChange={handleBatchInputChange}
                      required
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">请选择会员卡</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name} ({card.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="batch-startDate" className="block text-sm font-medium text-gray-700">
                        开始日期
                      </label>
                      <input
                        type="date"
                        id="batch-startDate"
                        name="startDate"
                        value={batchFormData.startDate}
                        onChange={handleBatchInputChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="batch-endDate" className="block text-sm font-medium text-gray-700">
                        结束日期
                      </label>
                      <input
                        type="date"
                        id="batch-endDate"
                        name="endDate"
                        value={batchFormData.endDate}
                        onChange={handleBatchInputChange}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        id="batch-isUsed"
                        name="isUsed"
                        type="checkbox"
                        checked={batchFormData.isUsed}
                        onChange={handleBatchInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="batch-isUsed" className="ml-2 block text-sm text-gray-900">
                        已使用
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="batch-isSold"
                        name="isSold"
                        type="checkbox"
                        checked={batchFormData.isSold}
                        onChange={handleBatchInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="batch-isSold" className="ml-2 block text-sm text-gray-900">
                        已售出
                      </label>
                    </div>
                  </div>
                  {batchFormData.isSold && (
                    <div>
                      <label htmlFor="batch-soldPrice" className="block text-sm font-medium text-gray-700">
                        售出价格
                      </label>
                      <input
                        type="number"
                        id="batch-soldPrice"
                        name="soldPrice"
                        value={batchFormData.soldPrice}
                        onChange={handleBatchInputChange}
                        step="0.01"
                        min="0"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="batch-notes" className="block text-sm font-medium text-gray-700">
                      备注
                    </label>
                    <textarea
                      id="batch-notes"
                      name="notes"
                      rows={3}
                      value={batchFormData.notes}
                      onChange={handleBatchInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsBatchAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    批量添加
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 批量编辑记录模态框 */}
      {isBatchEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                批量修改关联会员卡 ({selectedRecords.length} 条记录)
              </h3>
              <form onSubmit={handleBatchEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="batch-edit-cardId" className="block text-sm font-medium text-gray-700">
                      选择新的会员卡
                    </label>
                  </div>
                  
                  <div>
                    <select
                      id="batch-edit-cardId"
                      name="cardId"
                      value={batchEditFormData.cardId}
                      onChange={handleBatchEditInputChange}
                      required
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">请选择会员卡</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name} ({card.type})
                        </option>
                      ))}
                    </select>
                  </div>
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
                    批量修改会员卡
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 添加记录模态框 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">添加使用记录</h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="cardId" className="block text-sm font-medium text-gray-700">
                      选择会员卡
                    </label>
                    <select
                      id="cardId"
                      name="cardId"
                      value={formData.cardId}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">请选择会员卡</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name} ({card.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                      日期
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isUsed"
                      name="isUsed"
                      checked={formData.isUsed}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isUsed" className="ml-2 block text-sm text-gray-900">
                      已使用
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isSold"
                      name="isSold"
                      checked={formData.isSold}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isSold" className="ml-2 block text-sm text-gray-900">
                      已售出
                    </label>
                  </div>
                  {formData.isSold && (
                    <div>
                      <label htmlFor="soldPrice" className="block text-sm font-medium text-gray-700">
                        售出价格
                      </label>
                      <input
                        type="number"
                        id="soldPrice"
                        name="soldPrice"
                        value={formData.soldPrice}
                        onChange={handleInputChange}
                        required={formData.isSold}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      备注
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
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

      {/* 编辑记录模态框 */}
      {isEditModalOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">编辑使用记录</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-cardId" className="block text-sm font-medium text-gray-700">
                      选择会员卡
                    </label>
                    <select
                      id="edit-cardId"
                      name="cardId"
                      value={formData.cardId}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">请选择会员卡</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name} ({card.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700">
                      日期
                    </label>
                    <input
                      type="date"
                      id="edit-date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-isUsed"
                      name="isUsed"
                      checked={formData.isUsed}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-isUsed" className="ml-2 block text-sm text-gray-900">
                      已使用
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-isSold"
                      name="isSold"
                      checked={formData.isSold}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-isSold" className="ml-2 block text-sm text-gray-900">
                      已售出
                    </label>
                  </div>
                  {formData.isSold && (
                    <div>
                      <label htmlFor="edit-soldPrice" className="block text-sm font-medium text-gray-700">
                        售出价格
                      </label>
                      <input
                        type="number"
                        id="edit-soldPrice"
                        name="soldPrice"
                        value={formData.soldPrice}
                        onChange={handleInputChange}
                        required={formData.isSold}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700">
                      备注
                    </label>
                    <textarea
                      id="edit-notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    ></textarea>
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

      {/* 批量复制记录模态框 */}
      {isBatchCopyModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                批量复制记录 ({selectedRecords.length} 条记录)
              </h3>
              <form onSubmit={handleBatchCopySubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="batch-copy-date" className="block text-sm font-medium text-gray-700">
                      选择复制到的目标日期（可选）
                    </label>
                    <input
                      type="date"
                      id="batch-copy-date"
                      name="targetDate"
                      value={batchCopyFormData.targetDate}
                      onChange={handleBatchCopyInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    如果不选择日期，则使用原记录的日期进行复制
                  </p>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsBatchCopyModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    确认复制
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