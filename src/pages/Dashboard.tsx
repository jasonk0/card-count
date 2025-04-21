import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCards } from '../hooks/useCards';
import { useUsageRecords } from '../hooks/useUsageRecords';
import * as api from '../api';

export default function Dashboard() {
  const { cards, loading: cardsLoading } = useCards();
  const { records, loading: recordsLoading } = useUsageRecords();
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stats, setStats] = useState({
    totalCards: 0,
    activeCards: 0,
    totalUsage: 0,
    totalCost: 0,
    averageCostPerUse: 0,
    cardStats: [] as {
      id: string;
      name: string;
      usageCount: number;
      originalPrice: number;
      salesRevenue: number;
      netCost: number;
      costPerUse: number;
      expectedPricePerUse: number;
      remainingUsesToExpected: number;
      extraValueAmount: number;
    }[]
  });

  useEffect(() => {
    if (cardsLoading || recordsLoading) return;

    // 计算总体统计数据
    const activeCards = cards.filter(card => card.isActive).length;
    const totalUsage = records.filter(record => record.isUsed).length;
    const personalTotalUsage = records.filter(record => record.isUsed && !record.isSold).length;
    
    // 计算每张卡的统计数据
    const cardStats = cards.map(card => {
      // 获取该卡的所有记录
      const cardRecords = records.filter(record => record.cardId === card.id);
      
      // 使用次数
      const usageCount = cardRecords.filter(record => record.isUsed).length;
      const personalUsageCount = cardRecords.filter(record => record.isUsed && !record.isSold).length;
      
      // 卡的原始价格
      const originalPrice = card.price || 0;
      
      // 卡的销售收入（所有售出记录的价格总和）
      const salesRevenue = cardRecords
        .filter(record => record.isSold && record.soldPrice)
        .reduce((sum, record) => sum + (record.soldPrice || 0), 0);
      
      // 计算净成本 = 原始价格 - 销售收入
      const netCost = originalPrice - salesRevenue;
      
      // 单次使用成本 = 净成本 / 使用次数
      const costPerUse = personalUsageCount > 0 ? netCost / personalUsageCount : 0;
      
      // 预期单次价格
      const expectedPricePerUse = card.expectedPricePerUse || 0;
      
      // 计算距离预期单次价格还差多少次使用
      let remainingUsesToExpected = 0;
      if (expectedPricePerUse > 0 && costPerUse > expectedPricePerUse) {
        // 差多少次使用 = 净成本 / 预期单次价格 - 当前使用次数
        remainingUsesToExpected = Math.ceil(netCost / expectedPricePerUse - personalUsageCount);
      }
      
      // 计算超值金额：预期单次价格 * 个人使用次数 - 卡的价格
      // 只有当实际单次价格低于预期单次价格时才计算
      let extraValueAmount = 0;
      if (costPerUse < expectedPricePerUse && expectedPricePerUse > 0) {
        extraValueAmount = expectedPricePerUse * personalUsageCount - netCost;
      }

      return {
        id: card.id,
        name: card.name,
        usageCount,
        originalPrice,
        salesRevenue,
        netCost,
        costPerUse,
        expectedPricePerUse,
        remainingUsesToExpected,
        extraValueAmount
      };
    });

    // 计算总成本和平均单次成本
    const totalCost = cardStats.reduce((sum, card) => sum + card.netCost, 0);


    const averageCostPerUse = personalTotalUsage > 0 ? totalCost / personalTotalUsage : 0;

    setStats({
      totalCards: cards.length,
      activeCards,
      totalUsage,
      totalCost,
      averageCostPerUse,
      cardStats
    });
  }, [cards, records, cardsLoading, recordsLoading]);

  // 导出数据为文件
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const data = await api.exportData();
      
      // 创建JSON文件并下载
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `会员卡数据导出_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      
      // 清理URL对象
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      setMessage({ type: 'success', text: '数据导出成功！' });
    } catch (error) {
      console.error('导出数据失败:', error);
      setMessage({ type: 'error', text: '导出数据失败，请重试' });
    } finally {
      setExportLoading(false);
      // 5秒后清除消息
      setTimeout(() => setMessage(null), 5000);
    }
  };
  
  // 触发文件选择对话框
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // 导入数据
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      
      setImportLoading(true);
      const result = await api.importData(file);
      
      setMessage({ 
        type: 'success', 
        text: `导入成功！导入了${result.cardsCount}张会员卡和${result.recordsCount}条使用记录。请刷新页面查看最新数据。` 
      });
      
      // 重新加载页面以显示导入的数据
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('导入数据失败:', error);
      setMessage({ type: 'error', text: '导入数据失败，请检查文件格式' });
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // 5秒后清除消息
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (cardsLoading || recordsLoading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">控制台</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {exportLoading ? '导出中...' : '导出数据'}
          </button>
          <button
            onClick={triggerFileInput}
            disabled={importLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {importLoading ? '导入中...' : '导入数据'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* 显示消息 */}
      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* 总体统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="会员卡总数" value={stats.totalCards} />
        <StatCard title="激活会员卡" value={stats.activeCards} />
        <StatCard title="总使用次数" value={stats.totalUsage} />
        <StatCard title="平均单次成本" value={`￥${stats.averageCostPerUse.toFixed(2)}`} />
      </div>

      {/* 每张卡的统计数据 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">各会员卡使用统计</h3>
        {stats.cardStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    会员卡名称
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    使用次数
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    原始价格
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    销售收入
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    净成本
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    单次成本
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    预期单价
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    回本次数
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    超值金额
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.cardStats.map((cardStat) => (
                  <tr key={cardStat.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cardStat.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cardStat.usageCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ￥{cardStat.originalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ￥{cardStat.salesRevenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ￥{cardStat.netCost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cardStat.usageCount > 0 ? `￥${cardStat.costPerUse.toFixed(2)}` : '无使用记录'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cardStat.expectedPricePerUse > 0 ? `￥${cardStat.expectedPricePerUse.toFixed(2)}` : '未设置'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cardStat.expectedPricePerUse > 0 ? 
                        (cardStat.remainingUsesToExpected > 0 ? 
                          `还需${cardStat.remainingUsesToExpected}次` : 
                          '已达预期') : 
                        '未设置预期价格'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cardStat.extraValueAmount > 0 ? 
                        <span className="text-green-600">￥{cardStat.extraValueAmount.toFixed(2)}</span> : 
                        '暂无超值'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">暂无会员卡统计数据</p>
        )}
      </div>

      {/* 最近活动 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">最近活动</h3>
        {records.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {records.slice(0, 5).map((record) => {
              const card = cards.find(c => c.id === record.cardId);
              return (
                <li key={record.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {card?.name || '未知会员卡'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(record.date).toLocaleDateString()} - 
                        {record.isUsed ? '使用' : (record.isSold ? '售出' : '未使用')}
                      </p>
                    </div>
                    {record.isSold && record.soldPrice && (
                      <span className="text-green-600 font-medium">
                        +￥{record.soldPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-gray-500">暂无活动记录</p>
        )}
      </div>

      {/* 即将到期的会员卡 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">即将到期的会员卡</h3>
        {cards.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {cards
              .filter(card => card.isActive && new Date(card.endDate) <= new Date(Date.now() + 30 * 24 * 3600 * 1000))
              .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
              .slice(0, 3)
              .map((card) => (
                <li key={card.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{card.name}</p>
                      <p className="text-sm text-gray-500">
                        到期日: {new Date(card.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      to={`/cards/${card.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      查看详情
                    </Link>
                  </div>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-gray-500">暂无即将到期的会员卡</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
} 