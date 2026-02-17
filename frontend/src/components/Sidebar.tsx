
import React from 'react';
import { Users, Briefcase, BarChart3, Settings, Zap } from 'lucide-react';

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors duration-150 ${active ? 'sidebar-active text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </div>
);

export const Sidebar: React.FC<{ activeView: string; onViewChange: (view: any) => void }> = ({ activeView, onViewChange }) => {
  return (
    <div className="w-72 solid-panel h-[calc(100vh-2rem)] m-4 p-8 flex flex-col fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-black tracking-tight text-white">HR-Magnet</span>
      </div>

      <nav className="flex-1 space-y-3">
        <SidebarItem
          icon={<Users className="w-5 h-5" />}
          label="Кандидаты"
          active={activeView === 'candidates'}
          onClick={() => onViewChange('candidates')}
        />
        <SidebarItem
          icon={<Briefcase className="w-5 h-5" />}
          label="Вакансии"
          active={activeView === 'vacancies'}
          onClick={() => onViewChange('vacancies')}
        />
        <SidebarItem
          icon={<BarChart3 className="w-5 h-5" />}
          label="Отчеты"
          active={activeView === 'reports'}
          onClick={() => onViewChange('reports')}
        />
        <SidebarItem
          icon={<Settings className="w-5 h-5" />}
          label="Настройки"
          active={activeView === 'settings'}
          onClick={() => onViewChange('settings')}
        />
      </nav>

      <div className="mt-auto pt-8 border-t border-white/5">
        <div className="flex items-center gap-4 px-2 group cursor-pointer">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-xs shadow-inner">
            АД
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">Администратор</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
