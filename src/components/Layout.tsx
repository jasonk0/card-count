import { Outlet, Link, useLocation } from 'react-router-dom'
import { HomeIcon, IdentificationIcon, ClockIcon, CalendarIcon, BoltIcon } from '@heroicons/react/24/outline'
import React, { ReactNode } from 'react'

const navItems = [
  { name: '控制台', path: '/', icon: HomeIcon },
  { name: '会员卡', path: '/cards', icon: IdentificationIcon },
  { name: '使用记录', path: '/history', icon: ClockIcon },
  { name: '日历视图', path: '/calendar', icon: CalendarIcon },
  { name: '快捷记录', path: '/quick-record', icon: BoltIcon },
]

interface LayoutProps {
  children?: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const location = useLocation()
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center mb-2 justify-center">
            <div className='overflow-hidden'>
            <img src="/logo.png" alt="会员卡管理系统" className="h-30 w-30 -mt-3 -mb-3"  />
            </div>
           <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title || "会员卡管理系统"}</h1>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 min-h-screen">
        <div className="flex flex-col md:flex-row">
          <nav className="bg-white shadow-md rounded-lg my-4 md:w-42 md:min-h-[calc(100vh-120px)] md:mr-4 md:sticky md:top-4">
       
            <ul className="p-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                return (
                  <li key={item.path} className="mb-2">
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-blue-50 text-blue-600 shadow-sm font-medium' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-500'} mr-3`} />
                      <span>{item.name}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="p-4 mt-auto">
              <div className="text-xs text-gray-500 text-center">
                版本 1.0
              </div>
            </div>
          </nav>
          <main className="flex-1 bg-white rounded-lg shadow-md p-6 my-4">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </div>
  )
} 