import React from 'react';
import { Button } from './ui/button';
import { Screen } from '../types';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  hasActiveSession: boolean;
}

const navigationItems = [
  {
    icon: "➕",
    label: "Create Session",
    screen: 'create' as Screen,
  },
  {
    icon: "👥",
    label: "Participants",
    screen: 'participants' as Screen,
  },
  {
    icon: "💳",
    label: "Payments",
    screen: 'payments' as Screen,
  },
  {
    icon: "📜",
    label: "History",
    screen: 'history' as Screen,
  },
];

export const Navigation: React.FC<NavigationProps> = ({ 
  currentScreen, 
  onNavigate, 
  hasActiveSession 
}) => {
  return (
    <nav className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
      <div className="flex items-start gap-1 sm:gap-2 pt-2 pb-3 px-2 sm:px-4 relative self-stretch w-full flex-[0_0_auto] bg-[#1c3023] border-t [border-top-style:solid] border-[#264433]">
        {navigationItems.map((item) => {
          const isActive = item.screen === currentScreen;
          const isDisabled = !hasActiveSession && (item.screen === 'participants' || item.screen === 'payments');
          
          return (
            <Button
              key={item.screen}
              variant="ghost"
              disabled={isDisabled}
              onClick={() => onNavigate(item.screen)}
              className={`flex flex-col items-center justify-end gap-0.5 sm:gap-1 relative flex-1 grow rounded-[36px] h-16 sm:h-[72px] hover:bg-transparent p-0 ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span className="relative h-6 sm:h-8 text-lg">
                {item.icon}
              </span>

              <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                <span
                  className={`relative text-center mt-[-1.00px] [font-family:'Spline_Sans',Helvetica] font-medium text-[10px] sm:text-xs tracking-[0] leading-3 sm:leading-[18px] whitespace-nowrap ${
                    isActive ? "text-white" : "text-[#96c4a8]"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Button>
          );
        })}
      </div>

      <div className="h-4 sm:h-5 bg-[#1c3023] relative self-stretch w-full" />
    </nav>
  );
};