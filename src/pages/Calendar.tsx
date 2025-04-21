import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  isToday, 
  addYears,
  subYears,
  getYear,
  setMonth,
  setYear
} from 'date-fns';
import { useCards } from '../hooks/useCards';
import { useUsageRecords } from '../hooks/useUsageRecords';

export default function Calendar() {
  const { cards, loading: cardsLoading } = useCards();
  const { records, loading: recordsLoading } = useUsageRecords();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCard, setSelectedCard] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  
  // 计算日历数据
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = monthStart;
  const endDate = monthEnd;
  
  // 获取月份的所有日期
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  
  // 获取月份的第一天是星期几，周日是0，周六是6
  const startDay = getDay(monthStart);
  
  // 获取选定卡的活动记录
  const filteredRecords = records.filter(record => 
    selectedCard === 'all' || record.cardId === selectedCard
  );

  // 上一个月/年
  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subYears(currentDate, 1));
    }
  };

  // 下一个月/年
  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addYears(currentDate, 1));
    }
  };

  // 切换视图模式
  const toggleViewMode = () => {
    setViewMode(viewMode === 'month' ? 'year' : 'month');
  };

  // 选择月份（年视图中使用）
  const selectMonth = (monthIndex: number) => {
    const newDate = setMonth(currentDate, monthIndex);
    setCurrentDate(newDate);
    setViewMode('month');
  };

  // 获取某天的使用记录
  const getDayRecords = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return filteredRecords.filter(record => record.date === dateString);
  };

  // 获取某月有记录的天数
  const getMonthActivityCount = (monthIndex: number) => {
    const year = getYear(currentDate);
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    let usedCount = 0;
    let soldCount = 0;
    
    days.forEach(day => {
      const dateString = format(day, 'yyyy-MM-dd');
      const dayRecords = filteredRecords.filter(record => record.date === dateString);
      
      if (dayRecords.some(r => r.isUsed)) usedCount++;
      if (dayRecords.some(r => r.isSold)) soldCount++;
    });
    
    return { usedCount, soldCount };
  };

  if (cardsLoading || recordsLoading) {
    return <div className="p-4">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">日历视图</h2>
        <div className="flex items-center space-x-2">
          <label htmlFor="card-filter" className="text-sm font-medium text-gray-700">
            选择会员卡:
          </label>
          <select
            id="card-filter"
            value={selectedCard}
            onChange={(e) => setSelectedCard(e.target.value)}
            className="border border-gray-300 rounded-md text-sm p-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">所有会员卡</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>{card.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 日历控制器 */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <button
          onClick={prevPeriod}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          &lt;
        </button>
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold">
            {viewMode === 'month' 
              ? format(currentDate, 'yyyy年MM月')
              : format(currentDate, 'yyyy年')
            }
          </h2>
          <button
            onClick={toggleViewMode}
            className="ml-2 px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded"
          >
            {viewMode === 'month' ? '年视图' : '月视图'}
          </button>
        </div>
        <button
          onClick={nextPeriod}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          &gt;
        </button>
      </div>

      {/* 月视图 */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['日', '一', '二', '三', '四', '五', '六'].map((day, i) => (
              <div key={i} className="py-2 text-center text-sm font-medium text-gray-700 bg-white">
                {day}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {/* 填充月初空白 */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-start-${i}`} className="bg-white h-24 sm:h-32 p-2" />
            ))}

            {/* 日期 */}
            {daysInMonth.map((day, dayIndex) => {
              const dayRecords = getDayRecords(day);
              const hasUsed = dayRecords.some(r => r.isUsed);
              const hasSold = dayRecords.some(r => r.isSold);
              
              return (
                <div
                  key={dayIndex}
                  className={`bg-white h-24 sm:h-32 p-2 ${
                    isToday(day) ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex justify-between">
                    <span 
                      className={`text-sm font-medium ${
                        isToday(day) ? 'text-indigo-600' : 'text-gray-700'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="flex space-x-1">
                      {hasUsed && (
                        <span className="h-2 w-2 rounded-full bg-green-500" title="已使用"></span>
                      )}
                      {hasSold && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" title="已售出"></span>
                      )}
                    </div>
                  </div>

                  {/* 使用记录展示 */}
                  <div className="mt-1 space-y-1 overflow-y-auto max-h-20">
                    {dayRecords.map((record) => {
                      const card = cards.find(c => c.id === record.cardId);
                      return (
                        <div key={record.id} className="text-xs">
                          <div className="flex items-center space-x-1">
                            {record.isUsed && (
                              <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0"></span>
                            )}
                            {record.isSold && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                            )}
                            <span className="truncate">{card?.name || '未知卡'}</span>
                          </div>
                          {record.isSold && record.soldPrice && (
                            <div className="ml-3 text-green-600">¥{record.soldPrice}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* 填充月末空白 */}
            {Array.from({ length: (7 - ((startDay + daysInMonth.length) % 7)) % 7 }).map((_, i) => (
              <div key={`empty-end-${i}`} className="bg-white h-24 sm:h-32 p-2" />
            ))}
          </div>
        </div>
      )}

      {/* 年视图 */}
      {viewMode === 'year' && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, monthIndex) => {
              const { usedCount, soldCount } = getMonthActivityCount(monthIndex);
              const isCurrentMonth = new Date().getMonth() === monthIndex && 
                                    new Date().getFullYear() === getYear(currentDate);
              
              return (
                <div 
                  key={monthIndex}
                  onClick={() => selectMonth(monthIndex)}
                  className={`p-4 border rounded cursor-pointer hover:bg-indigo-50 transition-colors h-28
                             ${isCurrentMonth ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}
                >
                  <h3 className="text-center font-medium mb-4">
                    {monthIndex + 1}月
                  </h3>
                  <div className="flex justify-center space-x-4 text-xs text-gray-500">
                    {usedCount > 0 && (
                      <div className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                        <span>{usedCount}</span>
                      </div>
                    )}
                    {soldCount > 0 && (
                      <div className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-blue-500 mr-1"></span>
                        <span>{soldCount}</span>
                      </div>
                    )}
                    {usedCount === 0 && soldCount === 0 && (
                      <div className="text-gray-400">无记录</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 图例 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">图例</h3>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
            <span className="text-sm text-gray-600">已使用</span>
          </div>
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-blue-500 mr-2"></span>
            <span className="text-sm text-gray-600">已售出</span>
          </div>
        </div>
      </div>
    </div>
  );
} 