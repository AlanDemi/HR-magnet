
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
  skills?: string[];
  experience?: string;
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

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    NEW: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
    VIEWED: 'border-purple-500/50 text-purple-400 bg-purple-500/10',
    INTERVIEW: 'border-orange-500/50 text-orange-400 bg-orange-500/10',
    TEST_TASK: 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10',
    OFFER: 'border-pink-500/50 text-pink-400 bg-pink-500/10',
    HIRED: 'border-green-500 text-green-400 bg-green-500/20 shadow-lg shadow-green-500/20',
    REJECTED: 'border-red-500/50 text-red-400 bg-red-500/10',
    ARCHIVE: 'border-gray-500/50 text-gray-400 bg-gray-500/10',
    INVITED: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
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
    INVITED: 'ПРИГЛАШЕН',
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${styles[status] || 'border-gray-500/50 text-gray-400 bg-gray-500/10'}`}>
      {labels[status] || status}
    </span>
  );
};

const CandidateRow: React.FC<{
  candidate: Candidate;
  onViewDetails: (id: string) => void;
}> = ({ candidate, onViewDetails }) => {
  return (
    <div className="group hover:bg-white/[0.03] transition-all px-6 py-4 flex items-center gap-6 border-b border-white/[0.02] last:border-none">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm relative overflow-hidden group-hover:border-blue-500/30 transition-colors">
        <span className="relative z-10">{candidate.name.substring(0, 1)}</span>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex-1 grid grid-cols-[1.5fr_1.5fr_1fr_1.2fr] gap-6 items-center">
        <div className="min-w-0">
          <div className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors truncate">{candidate.name}</div>
          <div className="text-[10px] text-gray-400 truncate mt-0.5 opacity-80">
            {candidate.email}
          </div>
        </div>

        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-300 truncate">{candidate.role}</div>
          <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
            <div className="flex gap-1 shrink-0">
              {candidate.skills?.slice(0, 2).map(s => (
                <span key={s} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] text-gray-400 uppercase font-black">{s}</span>
              ))}
            </div>
            {candidate.experience && candidate.experience !== '0' && (
              <span className="text-[9px] text-blue-400/40 font-black uppercase tracking-tighter shrink-0 border-l border-white/10 pl-2">Опыт: {candidate.experience}г</span>
            )}
          </div>
        </div>

        <div className="flex justify-start">
          <StatusBadge status={candidate.status} />
        </div>

        <div className="text-right pr-4">
          <div className="text-xs text-gray-200 font-mono tracking-tight transition-colors whitespace-nowrap">
            {candidate.date}
          </div>
        </div>
      </div>

      <div className="w-[80px] flex justify-end">
        <button
          onClick={() => onViewDetails(candidate.id)}
          className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30 transition-all border border-white/5 group/btn shadow-sm"
          title="Подробнее"
        >
          <ExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
};

const ITEMS_PER_PAGE = 8;

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
  const [currentPage, setCurrentPage] = React.useState(1);
  const totalPages = Math.ceil(candidates.length / ITEMS_PER_PAGE);
  const paginatedCandidates = candidates.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, vacancyFilter]);

  return (
    <div className="w-full space-y-6">
      <div className="w-full space-y-6">
        {/* Filters Bar */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[300px] glass-panel bg-white/5 border-white/10 flex items-center px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-500 mr-2.5" />
            <input
              type="text"
              placeholder="Поиск по имени, email, навыкам..."
              className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-gray-500"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select
                className="glass-panel px-5 py-2.5 bg-transparent text-sm appearance-none pr-12 cursor-pointer hover:bg-white/10 outline-none border-none transition-all font-medium text-gray-300"
                value={vacancyFilter}
                onChange={(e) => onVacancyFilterChange(e.target.value)}
                style={{ WebkitAppearance: 'none' }}
              >
                <option value="ALL">Все вакансии</option>
                {vacancies.map(v => (
                  <option key={v.id} value={v.id}>{v.title}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                className="glass-panel px-5 py-2.5 bg-transparent text-sm appearance-none pr-12 cursor-pointer hover:bg-white/10 outline-none border-none transition-all font-medium text-gray-300"
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                style={{ WebkitAppearance: 'none' }}
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
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Unified Table Container */}
        <div className="glass-panel overflow-hidden border border-white/10 bg-white/[0.02] shadow-2xl">
          {/* Table Header */}
          <div className="px-6 py-5 flex items-center gap-6 bg-white/[0.04] border-b border-white/10 text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] opacity-80">
            <div className="w-10 shrink-0">Фото</div>
            <div className="flex-1 grid grid-cols-[1.5fr_1.5fr_1fr_1.2fr] gap-6 items-center">
              <div>Кандидат</div>
              <div>Направление / Опыт</div>
              <div>Статус</div>
              <div className="text-right pr-4">Дата отклика</div>
            </div>
            <div className="w-[80px] text-right">Детали</div>
          </div>

          {/* Table Content */}
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            {paginatedCandidates.length > 0 ? (
              paginatedCandidates.map((candidate) => (
                <CandidateRow
                  key={candidate.id}
                  candidate={candidate}
                  onViewDetails={onViewDetails}
                />
              ))
            ) : (
              <div className="py-24 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 opacity-20">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <div className="italic text-gray-500 font-medium">Кандидатов не найдено</div>
              </div>
            )}
          </div>

          {/* Table Footer / Pagination */}
          <div className="px-6 py-4 flex justify-between items-center bg-white/[0.03] border-t border-white/10">
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                Всего результатов: <span className="text-gray-200">{candidates.length}</span>
              </span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all"
                >
                  <ChevronDown className="rotate-90 w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${currentPage === i + 1
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:bg-white/10 hover:text-white disabled:opacity-20 transition-all"
                >
                  <ChevronDown className="-rotate-90 w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
