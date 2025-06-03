import React, { useState, useEffect } from 'react';
import { getTokenInfo, createToken, getAllTokens, revokeToken, cleanupExpiredTokens, deleteToken } from '../api';

interface TokenInfo {
  user: { id: string; username: string; role: string };
  issuedAt: string;
  expiresAt: string;
  timeRemaining: number;
}

interface TokenRecord {
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
}

export default function TokenManager() {
  const [currentTokenInfo, setCurrentTokenInfo] = useState<TokenInfo | null>(null);
  const [allTokens, setAllTokens] = useState<TokenRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [newTokenResult, setNewTokenResult] = useState<any>(null);
  
  // 创建token的表单数据
  const [expiresIn, setExpiresIn] = useState('99y');
  const [description, setDescription] = useState('');
  const [customExpires, setCustomExpires] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  // 预设的过期时间选项
  const expiresOptions = [
    { value: '1h', label: '1小时' },
    { value: '1d', label: '1天' },
    { value: '7d', label: '7天' },
    { value: '30d', label: '30天' },
    { value: '1y', label: '1年' },
    { value: '99y', label: '99年（默认）' },
  ];

  useEffect(() => {
    loadCurrentTokenInfo();
    loadAllTokens();
  }, []);

  const loadCurrentTokenInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const info = await getTokenInfo();
      setCurrentTokenInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取token信息失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAllTokens = async () => {
    setTokensLoading(true);
    setError(null);
    
    try {
      console.log('开始获取token列表...');
      console.log('API_BASE_URL:', window.location.origin.includes('localhost') 
        ? 'http://localhost:5000/api'  
        : '/api');
      console.log('当前token:', localStorage.getItem('auth_token') ? '已存在' : '不存在');
      
      const tokens = await getAllTokens();
      console.log('获取到的token列表:', tokens);
      setAllTokens(tokens);
    } catch (err) {
      console.error('获取token列表失败:', err);
      setError(`获取token列表失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setTokensLoading(false);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setCreateLoading(true);
    setError(null);
    setNewTokenResult(null);

    try {
      const finalExpiresIn = useCustom ? customExpires : expiresIn;
      const result = await createToken(finalExpiresIn, description || undefined);
      setNewTokenResult(result);
      
      // 重置表单
      setDescription('');
      setCustomExpires('');
      setUseCustom(false);
      setExpiresIn('99y');
      
      // 重新加载token列表
      loadAllTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建token失败');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRevokeToken = async (tokenId: string, description: string) => {
    if (!confirm(`确定要撤销token"${description}"吗？撤销后该token将立即失效。`)) {
      return;
    }

    try {
      await revokeToken(tokenId);
      alert('Token已成功撤销');
      loadAllTokens();
    } catch (err) {
      alert('撤销失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleDeleteToken = async (tokenId: string, description: string) => {
    if (!confirm(`确定要永久删除token"${description}"吗？此操作不可撤销！`)) {
      return;
    }

    try {
      await deleteToken(tokenId);
      alert('Token已永久删除');
      loadAllTokens();
    } catch (err) {
      alert('删除失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleCleanupExpiredTokens = async () => {
    if (!confirm('确定要清理所有过期的token吗？此操作不可撤销。')) {
      return;
    }

    try {
      const result = await cleanupExpiredTokens();
      alert(result.message);
      loadAllTokens();
    } catch (err) {
      alert('清理失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 0) return '已过期';
    
    const years = Math.floor(seconds / (365 * 24 * 3600));
    const days = Math.floor((seconds % (365 * 24 * 3600)) / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (years > 0) return `${years}年${days}天`;
    if (days > 0) return `${days}天${hours}小时`;
    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板');
    }).catch(() => {
      alert('复制失败，请手动复制');
    });
  };

  const getTokenStatusBadge = (token: TokenRecord) => {
    if (!token.isActive) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">已撤销</span>;
    }
    if (token.isExpired) {
      return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">已过期</span>;
    }
    if (token.isCurrentToken) {
      return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">当前使用</span>;
    }
    return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">有效</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Token管理</h2>
        
        {/* 调试信息 */}
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
          <h4 className="font-medium mb-2">调试信息：</h4>
          <div>API地址: {window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api'}</div>
          <div>当前token: {localStorage.getItem('auth_token') ? '✅ 已存在' : '❌ 不存在'}</div>
          <div>Token列表状态: 正在加载={tokensLoading ? '✅' : '❌'}, 错误={error ? '❌' : '✅'}, 数量={allTokens.length}</div>
          <button
            onClick={() => {
              console.log('=== 完整调试信息 ===');
              console.log('localStorage token:', localStorage.getItem('auth_token'));
              console.log('allTokens:', allTokens);
              console.log('error:', error);
              console.log('tokensLoading:', tokensLoading);
            }}
            className="mt-2 text-blue-600 hover:text-blue-800 text-xs"
          >
            📋 输出完整调试信息到控制台
          </button>
        </div>
        
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {currentTokenInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-lg font-medium text-blue-800 mb-3">当前Token信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>用户：</strong>{currentTokenInfo.user.username} ({currentTokenInfo.user.role})
              </div>
              <div>
                <strong>剩余时间：</strong>
                <span className={currentTokenInfo.timeRemaining > 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatTimeRemaining(currentTokenInfo.timeRemaining)}
                </span>
              </div>
              <div>
                <strong>创建时间：</strong>{new Date(currentTokenInfo.issuedAt).toLocaleString()}
              </div>
              <div>
                <strong>过期时间：</strong>{new Date(currentTokenInfo.expiresAt).toLocaleString()}
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={loadCurrentTokenInfo}
                className="text-blue-600 hover:text-blue-800 text-sm mr-4"
              >
                🔄 刷新信息
              </button>
              <button
                onClick={loadAllTokens}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                🔄 刷新Token列表
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 所有Token列表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">所有Token ({allTokens.length})</h3>
          <button
            onClick={handleCleanupExpiredTokens}
            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
          >
            🗑️ 清理过期Token
          </button>
        </div>
        
        {tokensLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 text-sm">加载Token列表...</p>
          </div>
        ) : allTokens.length === 0 ? (
          <p className="text-gray-500 text-center py-4">暂无Token记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    描述
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    过期时间
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    剩余时间
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allTokens.map((token) => (
                  <tr key={token.id} className={token.isCurrentToken ? 'bg-blue-50' : ''}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <div>
                        <div className="font-medium text-gray-900">{token.description}</div>
                        <div className="text-gray-500 text-xs">
                          {token.source === 'login' ? '登录获取' : '手动创建'}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      {getTokenStatusBadge(token)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(token.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(token.expiresAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <span className={token.timeRemaining > 0 && token.isActive ? 'text-green-600' : 'text-red-600'}>
                        {formatTimeRemaining(token.timeRemaining)}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col space-y-1">
                        <div className="flex space-x-2">
                          {token.isActive && !token.isCurrentToken && (
                            <button
                              onClick={() => handleRevokeToken(token.id, token.description)}
                              className="text-yellow-600 hover:text-yellow-800 text-xs"
                              title="撤销Token（保留记录）"
                            >
                              ⏸️ 撤销
                            </button>
                          )}
                          {!token.isCurrentToken && (
                            <button
                              onClick={() => handleDeleteToken(token.id, token.description)}
                              className="text-red-600 hover:text-red-800 text-xs"
                              title="永久删除Token"
                            >
                              🗑️ 删除
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(token.token)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                            title="复制Token"
                          >
                            📋 复制
                          </button>
                        </div>
                        {token.revokedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            撤销时间: {new Date(token.revokedAt).toLocaleString()}
                            <br />
                            撤销人: {token.revokedBy}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">创建新Token</h3>
        
        <form onSubmit={handleCreateToken} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述（可选）
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：iOS快捷指令专用token"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              过期时间
            </label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="preset"
                  checked={!useCustom}
                  onChange={(e) => setUseCustom(!e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="preset" className="text-sm text-gray-700">使用预设时间</label>
              </div>
              
              {!useCustom && (
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {expiresOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center">
                <input
                  type="radio"
                  id="custom"
                  checked={useCustom}
                  onChange={(e) => setUseCustom(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="custom" className="text-sm text-gray-700">自定义时间</label>
              </div>
              
              {useCustom && (
                <div>
                  <input
                    type="text"
                    value={customExpires}
                    onChange={(e) => setCustomExpires(e.target.value)}
                    placeholder="例如：5d, 2h, 30m, 1y"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required={useCustom}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    格式：数字+单位 (s=秒, m=分, h=小时, d=天, y=年)
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={createLoading || (useCustom && !customExpires.trim())}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {createLoading ? '创建中...' : '创建新Token'}
          </button>
        </form>

        {newTokenResult && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="text-lg font-medium text-green-800 mb-3">✅ 新Token创建成功！</h4>
            <div className="space-y-3 text-sm">
              <div>
                <strong>描述：</strong>{newTokenResult.description}
              </div>
              <div>
                <strong>过期时间：</strong>{new Date(newTokenResult.expiresAt).toLocaleString()}
              </div>
              <div>
                <strong>Token：</strong>
                <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs break-all">
                  {newTokenResult.token}
                </div>
                <button
                  onClick={() => copyToClipboard(newTokenResult.token)}
                  className="mt-1 text-green-600 hover:text-green-800 text-sm"
                >
                  📋 复制Token
                </button>
              </div>
            </div>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm">
                ⚠️ 请立即保存此Token，关闭页面后将无法再次查看！
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 