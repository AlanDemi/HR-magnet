
import React from 'react';
import { Search, ChevronDown, Check, X, ExternalLink } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  source: string;
  status: string;
  date: string;
  avatar: string;
}

interface CandidateTableProps {
  candidates: Candidate[];
  onStatusUpdate: (id: string, status: string) => void;
  onViewDetails: (id: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  vacancyFilter: string;
  onVacancyFilterChange: (val: string) => void;
  vacancies: { id: string, title: string }[];
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    NEW: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
    VIEWED: 'border-purple-500/50 text-purple-400 bg-purple-500/10',
    INTERVIEW: 'border-orange-500/50 text-orange-400 bg-orange-500/10',
    TEST_TASK: 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10',
    OFFER: 'border-pink-500/50 text-pink-400 bg-pink-500/10',
    HIRED: 'border-green-500 text-green-400 bg-green-500/20 shadow-lg shadow-green-500/20',
    REJECTED: 'border-red-500/50 text-red-400 bg-red-500/10',
    ARCHIVE: 'border-gray-500/50 text-gray-400 bg-gray-500/10',
  };

  const labels: Record<string, string> = {
    NEW: 'НОВЫЙ',
    VIEWED: 'ПРОСМОТРЕН',
    INTERVIEW: 'ИНТЕРВЬЮ',
    TEST_TASK: 'ТЕСТОВОЕ',
    OFFER: 'ОФФЕР',
    HIRED: 'НАНЯТ',
    REJECTED: 'ОТКАЗ',
    ARCHIVE: 'АРХИВ',
  };

  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${styles[status] || 'border-gray-500/50 text-gray-400 bg-gray-500/10'}`}>
      {labels[status] || status}
    </span>
  );
};

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  onStatusUpdate,
  onViewDetails,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  vacancyFilter,
  onVacancyFilterChange,
  vacancies
}) => {
  return (
    <div className="w-full space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[300px] glass-panel bg-white/5 border-white/10 flex items-center px-4 py-2">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Поиск по имени, email, навыкам..."
            className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-gray-500"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="glass-panel px-4 py-2 bg-transparent text-sm appearance-none pr-8 cursor-pointer hover:bg-white/5 outline-none"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="ALL">Все статусы</option>
            <option value="NEW">Новый</option>
            <option value="VIEWED">Просмотрен</option>
            <option value="INTERVIEW">Интервью</option>
            <option value="TEST_TASK">Тестовое</option>
            <option value="OFFER">Оффер</option>
            <option value="HIRED">Нанят</option>
            <option value="REJECTED">Отказ</option>
            <option value="ARCHIVE">Архив</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            className="glass-panel px-4 py-2 bg-transparent text-sm appearance-none pr-8 cursor-pointer hover:bg-white/5 outline-none"
            value={vacancyFilter}
            onChange={(e) => onVacancyFilterChange(e.target.value)}
          >
            <option value="ALL">Все вакансии</option>
            {vacancies.map(v => (
              <option key={v.id} value={v.id}>{v.title}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Table Rows */}
      <div className="space-y-2">
        {candidates.map((candidate) => (
          <div key={candidate.id} className="glass-panel group hover:bg-white/10 transition-colors p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center font-bold text-xs">
              {candidate.name.substring(0, 1)}
            </div>
            <div className="flex-1 grid grid-cols-4 gap-4 items-center">
              <div>
                <div className="font-semibold text-sm">{candidate.name}</div>
                <div className="text-[10px] text-gray-500">{candidate.email || ''}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">{candidate.role}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 capitalize">{candidate.source}</div>
              </div>
              <div className="flex justify-center">
                <StatusBadge status={candidate.status} />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-400 font-mono">{candidate.date}</span>
              <div className="flex items-center gap-2">
                <div className="relative group/actions">
                  <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors border border-white/10 flex items-center gap-2 text-xs font-bold">
                    Статус <ChevronDown className="w-3 h-3" />
                  </button>
                  <div className="absolute right-0 top-[110%] w-48 glass-panel bg-[#0f172a] invisible group-hover/actions:visible opacity-0 group-hover/actions:opacity-100 transition-all duration-200 z-50 p-2 space-y-1 shadow-2xl border border-white/10">
                    {[
                      { id: 'VIEWED', label: 'Просмотрен', color: 'text-purple-400' },
                      { id: 'INTERVIEW', label: 'Интервью', color: 'text-orange-400' },
                      { id: 'TEST_TASK', label: 'Тестовое', color: 'text-indigo-400' },
                      { id: 'OFFER', label: 'Оффер', color: 'text-pink-400' },
                      { id: 'HIRED', label: 'Нанят', color: 'text-green-400' },
                      { id: 'REJECTED', label: 'Отказ', color: 'text-red-400' },
                      { id: 'ARCHIVE', label: 'Архив', color: 'text-gray-400' },
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => onStatusUpdate(candidate.id, s.id)}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/5 text-xs font-bold transition-colors ${s.color}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => onViewDetails(candidate.id)}
                  className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors border border-blue-500/30"
                  title="Подробнее"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
