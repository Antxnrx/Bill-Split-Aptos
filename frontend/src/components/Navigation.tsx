"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Plus, Users, CreditCard, History, Wallet } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { wallet } = useApp();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/create', icon: Plus, label: 'Create' },
    { path: '/participants', icon: Users, label: 'Participants' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
    { path: '/history', icon: History, label: 'History' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-4 py-3 z-50 shadow-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3 transition-all duration-200",
                isActive 
                  ? "nav-icon-active transform scale-105" 
                  : "text-slate-600 hover:text-purple-500 hover:scale-105"
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Wallet Status */}
      <div className="flex items-center justify-center mt-3">
        <div className="wallet-connected">
          <div className={cn(
            "w-2 h-2 rounded-full inline-block mr-2",
            wallet?.isConnected ? "bg-green-400" : "bg-slate-400"
          )} />
          <span className="font-medium">
            {wallet?.isConnected ? `Connected: ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Not Connected'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
