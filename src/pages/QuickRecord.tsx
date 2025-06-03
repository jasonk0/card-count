import React, { useState } from 'react';
import { createQuickRecord } from '../api';

export default function QuickRecord() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyword.trim()) {
      setError('请输入关键字');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await createQuickRecord(keyword.trim());
      setResult(response);
      setKeyword(''); // 清空输入框
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建快捷记录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">快捷记录</h2>
        
        <div className="text-gray-600 mb-4">
          <p>通过输入会员卡名称的关键字，快速创建使用记录。</p>
          <p>适用于iOS快捷指令等自动化场景。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
              卡名称关键字
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="输入会员卡名称的部分文字..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !keyword.trim()}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? '创建中...' : '创建记录'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-medium text-green-800 mb-2">✅ {result.message}</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>匹配的会员卡：</strong>{result.card.name} ({result.card.type})</p>
              <p><strong>剩余次数：</strong>{result.card.remainingDays}</p>
              <p><strong>记录ID：</strong>{result.record.id}</p>
              <p><strong>记录日期：</strong>{result.record.date}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">API使用说明</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium">API端点</h4>
            <code className="bg-gray-100 px-2 py-1 rounded">POST /api/records/quick</code>
          </div>
          
          <div>
            <h4 className="font-medium">请求体</h4>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify({ keyword: "卡名称关键字" }, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-medium">成功响应</h4>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
              {`{
  "message": "快捷记录创建成功",
  "record": {
    "id": "记录ID",
    "cardId": "会员卡ID", 
    "date": "2024-01-01",
    "isUsed": true,
    "isSold": false,
    "soldPrice": null,
    "notes": "快捷记录 - 关键字",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "card": {
    // 更新后的会员卡信息
  },
  "keyword": "输入的关键字"
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium">iOS快捷指令使用示例</h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>创建新的快捷指令</li>
              <li>添加"获取网页内容"操作</li>
              <li>设置URL为：<code>http://你的服务器地址/api/records/quick</code></li>
              <li>设置方法为POST</li>
              <li>添加请求体：<code>{JSON.stringify({ keyword: "关键字" })}</code></li>
              <li>可以通过Siri语音触发</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 