
import React from 'react';
import { Users, Briefcase, BarChart3, Settings, Zap, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'admin';
  const userInitials = user?.username ? user.username.slice(0, 2).toUpperCase() : '??';

  return (
    <div className="w-72 solid-panel h-[calc(100vh-2rem)] m-4 p-8 flex flex-col fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
          <img src="/ustart_logo.png" alt="Logo" className="w-10 h-10 object-contain" />
        </div>
        <span className="text-2xl font-black tracking-tight text-white">UStart</span>
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

        {/* Only show Settings for Admin */}
        {isAdmin && (
          <SidebarItem
            icon={<Settings className="w-5 h-5" />}
            label="Настройки"
            active={activeView === 'settings'}
            onClick={() => onViewChange('settings')}
          />
        )}
      </nav>

      <div className="mt-auto space-y-4 pt-8 border-t border-white/5">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-xs shadow-inner uppercase">
              {userInitials}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate max-w-[100px]">{user?.username}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black leading-none">{user?.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
            title="Выйти"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
