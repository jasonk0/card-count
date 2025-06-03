import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, setToken, getToken } from '../api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState('99y');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 过期时间选项
  const expiresOptions = [
    { value: '1h', label: '1小时' },
    { value: '1d', label: '1天' },
    { value: '7d', label: '7天' },
    { value: '30d', label: '30天' },
    { value: '1y', label: '1年' },
    { value: '99y', label: '99年（推荐）' },
  ];

  // 如果已经登录，重定向到首页
  useEffect(() => {
    const token = getToken();
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await login(username.trim(), password, expiresIn);
      
      // 保存token
      setToken(response.token);
      
      // 重定向到首页
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <img src="/logo.png" alt="会员卡管理系统" className="h-20 w-20" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录到会员卡管理系统
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            默认账户：admin / admin123
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="用户名"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="密码"
                disabled={loading}
              />
            </div>
          </div>

          {/* 高级选项 */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {showAdvanced ? '隐藏' : '显示'}高级选项
            </button>
            
            {showAdvanced && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <label htmlFor="expiresIn" className="block text-sm font-medium text-gray-700 mb-2">
                  Token过期时间
                </label>
                <select
                  id="expiresIn"
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  disabled={loading}
                >
                  {expiresOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  选择较短的过期时间可以提高安全性
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !username.trim() || !password.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              登录后可以管理会员卡和使用记录
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 