'use client';

import React, { useState } from 'react';
import { Aperture, Settings, User, BotMessageSquare, ChevronRight, ChevronLeft, BrainCircuit, Wrench, Film, Folder } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarItem } from '@/components/ui/sidebar';

export const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'エージェント', icon: BotMessageSquare },
    { href: '/multi-agent', label: 'マルチエージェント', icon: BrainCircuit },
    { href: '/tools', label: 'ツール一覧', icon: Wrench },
    { href: '/media', label: 'メディア一覧', icon: Film },
    { href: '/documents', label: 'ドキュメント', icon: Folder },
  ];

  const bottomMenuItems = [
    { name: 'Settings', href: '#', icon: Settings, current: false },
  ];

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <aside 
      className={`${isExpanded ? 'w-56' : 'w-14'} transition-all duration-200 ease-in-out 
                 bg-gray-50 dark:bg-[#191919] border-r border-gray-200 dark:border-gray-800
                 text-gray-800 dark:text-gray-200 flex flex-col h-screen
                 relative`}
    >
      {/* Collapse Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                   rounded-full w-6 h-6 flex items-center justify-center shadow-sm z-10"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? (
          <ChevronLeft className="h-3 w-3 text-gray-500" />
        ) : (
          <ChevronRight className="h-3 w-3 text-gray-500" />
        )}
      </button>

      {/* Logo Area */}
      <div className="p-3 h-14 flex items-center">
        <div className="flex items-center justify-center w-8 h-8 text-blue-600">
          <Aperture className="h-6 w-6" />
        </div>
        {isExpanded && (
          <span className="ml-2 text-base font-medium">OpenSuperAgent</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-grow px-2 py-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex items-center px-2 py-1.5 text-sm rounded-md transition-colors
              ${pathname === item.href 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }
            `}
          >
            <item.icon className={`h-4 w-4 ${pathname === item.href ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
            {isExpanded && (
              <span className="ml-2">{item.label}</span>
            )}
          </a>
        ))}
        <SidebarItem href="/">
          <BotMessageSquare className="size-4" />
          エージェント
        </SidebarItem>
        <SidebarItem href="/multi-agent">
          <BrainCircuit className="size-4" />
          マルチエージェント
        </SidebarItem>
        <SidebarItem href="/memory-synapse">
          <BrainCircuit className="size-4" />
          Memory Synapse
        </SidebarItem>
      </nav>

      {/* Bottom Section */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        {bottomMenuItems.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 my-1"
          >
            <item.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            {isExpanded && (
              <span className="ml-2">{item.name}</span>
            )}
          </a>
        ))}
        <div className="mt-2 p-2 text-xs text-gray-500 dark:text-gray-400">
          {isExpanded && (
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              <span>Guest User</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}; 