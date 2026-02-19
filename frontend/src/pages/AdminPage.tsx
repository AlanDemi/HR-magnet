import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '../components/Sidebar';
import { StatCard } from '../components/StatCard';
import { FunnelChart } from '../components/FunnelChart';
import { CandidateTable, StatusBadge } from '../components/CandidateTable';
import { VacancyTable } from '../components/VacancyTable';
import { ReportsView } from '../components/ReportsView';
import { SettingsView } from '../components/SettingsView';
import { Candidate } from '../types';
import axios from 'axios';
import { User as UserIcon, Mail, Phone, Clock, Briefcase, FileText, Code, X, Download, ChevronDown, Check, Save, StickyNote, PieChart as PieIcon, Cpu, Globe, MessageSquare, Monitor } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';



const getYearString = (years: number) => {
    if (years === 0) return 'Без опыта';
    const lastDigit = years % 10;
    const lastTwoDigits = years % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${years} лет`;
    if (lastDigit === 1) return `${years} год`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${years} года`;
    return `${years} лет`;
};

const CHART_DATA = [
    { value: 1200 }, { value: 1400 }, { value: 1300 }, { value: 1542 }, { value: 1450 }, { value: 1600 }
];

const AdminPage: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [vacancies, setVacancies] = useState<{ id: string, title: string }[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // View state
    const [activeView, setActiveView] = useState<'candidates' | 'vacancies' | 'reports' | 'settings'>('candidates');
    const { user } = useAuth();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [vacancyFilter, setVacancyFilter] = useState('ALL');

    // Secondary safety check: if non-admin tries to access settings view, force them to candidates 
    useEffect(() => {
        if (activeView === 'settings' && user?.role !== 'admin') {
            setActiveView('candidates');
        }
    }, [activeView, user]);

    // Modal State
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    const fetchData = async () => {
        try {
            const [candResp, statsResp, vacResp] = await Promise.all([
                axios.get('/api/admin/candidates', {
                    params: {
                        limit: 100,
                        search: searchTerm || undefined,
                        status: statusFilter === 'ALL' ? undefined : statusFilter,
                        vacancy_id: vacancyFilter === 'ALL' ? undefined : vacancyFilter
                    }
                }),
                axios.get('/api/admin/stats'),
                axios.get('/api/admin/vacancies')
            ]);

            const mappedCandidates: Candidate[] = candResp.data.items.map((c: any) => ({
                id: String(c.id),
                name: c.full_name || 'Аноним',
                email: c.email || '',
                role: vacResp.data.find((v: any) => v.id === c.matched_vacancy_id)?.title || 'Общая',
                source: c.source,
                status: c.admin_status,
                date: new Date(c.created_at).toLocaleDateString('ru-RU'),
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name || 'A')}&background=random`,
                skills: c.skills_json || [],
                experience: c.experience_years ? String(c.experience_years) : '0'
            }));

            setCandidates(mappedCandidates);
            setStats(statsResp.data);
            setVacancies(vacResp.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchTerm, statusFilter, vacancyFilter]);

    const handleUpdateCandidate = async (id: string, updates: any) => {
        try {
            await axios.patch(`/api/admin/candidates/${id}`, updates);
            fetchData();
            if (selectedCandidate && String(selectedCandidate.id) === id) {
                setSelectedCandidate({ ...selectedCandidate, ...updates });
            }
        } catch (err) {
            console.error('Update failed:', err);
        }
    };

    const [copied, setCopied] = useState(false);

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleStatusUpdate = (id: string, status: string) => {
        handleUpdateCandidate(id, { admin_status: status });
    };

    const handleViewDetails = async (id: string) => {
        try {
            const resp = await axios.get(`/api/admin/candidates/${id}`);
            setSelectedCandidate(resp.data);
            setNotes(resp.data.admin_notes || '');
            setIsModalOpen(true);
        } catch (err) {
            console.error('Fetch detail failed:', err);
        }
    };

    const handleCreateVacancy = async (data: any) => {
        try {
            await axios.post('/api/admin/vacancies', data);
            fetchData();
        } catch (err) {
            console.error('Create vacancy failed:', err);
        }
    };

    const handleUpdateVacancy = async (id: string, data: any) => {
        try {
            await axios.patch(`/api/admin/vacancies/${id}`, data);
            fetchData();
        } catch (err) {
            console.error('Update vacancy failed:', err);
        }
    };

    const handleDeleteVacancy = async (id: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту вакансию?')) return;
        try {
            await axios.delete(`/api/admin/vacancies/${id}`);
            fetchData();
        } catch (err) {
            console.error('Delete vacancy failed:', err);
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get('/api/admin/export', {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'candidates_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Export failed:', err);
            alert('Не удалось скачать Excel файл. Проверьте авторизацию.');
        }
    };

    const handleDownloadResume = async (filename: string) => {
        try {
            const response = await axios.get(`/api/admin/resume/${encodeURIComponent(filename)}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract original filename if it has the timestamp prefix
            const cleanName = filename.includes('_') ? filename.split('_').slice(1).join('_') : filename;
            link.setAttribute('download', cleanName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Download resume failed:', err);
            alert('Не удалось скачать файл резюме.');
        }
    };

    const funnelSteps = stats ? [
        { label: 'Отклики', count: stats.total_candidates || 0, pct: '100%', color: 'rgba(59, 130, 246, 0.8)' },
        {
            label: 'Просмотры',
            count: (stats.status_breakdown?.['VIEWED'] || 0) + (stats.status_breakdown?.['INTERVIEW'] || 0) + (stats.status_breakdown?.['TEST_TASK'] || 0) + (stats.status_breakdown?.['OFFER'] || 0) + (stats.status_breakdown?.['HIRED'] || 0),
            pct: stats.total_candidates ? Math.round((((stats.status_breakdown?.['VIEWED'] || 0) + (stats.status_breakdown?.['INTERVIEW'] || 0) + (stats.status_breakdown?.['TEST_TASK'] || 0) + (stats.status_breakdown?.['OFFER'] || 0) + (stats.status_breakdown?.['HIRED'] || 0)) / stats.total_candidates) * 100) + '%' : '0%',
            color: 'rgba(59, 130, 246, 0.6)'
        },
        {
            label: 'Интервью',
            count: (stats.status_breakdown?.['INTERVIEW'] || 0) + (stats.status_breakdown?.['TEST_TASK'] || 0) + (stats.status_breakdown?.['OFFER'] || 0) + (stats.status_breakdown?.['HIRED'] || 0),
            pct: stats.total_candidates ? Math.round((((stats.status_breakdown?.['INTERVIEW'] || 0) + (stats.status_breakdown?.['TEST_TASK'] || 0) + (stats.status_breakdown?.['OFFER'] || 0) + (stats.status_breakdown?.['HIRED'] || 0)) / stats.total_candidates) * 100) + '%' : '0%',
            color: 'rgba(59, 130, 246, 0.4)'
        },
        {
            label: 'Офферы',
            count: (stats.status_breakdown?.['OFFER'] || 0) + (stats.status_breakdown?.['HIRED'] || 0),
            pct: stats.total_candidates ? Math.round((((stats.status_breakdown?.['OFFER'] || 0) + (stats.status_breakdown?.['HIRED'] || 0)) / stats.total_candidates) * 100) + '%' : '0%',
            color: 'rgba(59, 130, 246, 0.2)'
        },
        { label: 'Найм', count: stats.status_breakdown?.['HIRED'] || 0, pct: stats.total_candidates ? Math.round(((stats.status_breakdown?.['HIRED'] || 0) / stats.total_candidates) * 100) + '%' : '0%', color: 'rgba(16, 185, 129, 0.8)' },
    ] : [];

    return (
        <div className="flex min-h-screen circuit-bg">
            <Sidebar activeView={activeView} onViewChange={setActiveView} />

            <main className={`flex-1 ml-72 p-8 ${isModalOpen ? 'overflow-hidden pr-[calc(2rem-4px)]' : 'overflow-y-auto'}`}>
                <header className="flex justify-between items-center mb-10">

                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Панель управления</h1>
                        <p className="text-gray-500 text-sm mt-1">Добро пожаловать, <span className="text-blue-400 font-bold">{user?.username}</span></p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="glass-panel px-6 py-3 text-sm font-bold hover:bg-white/10 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 group border-white/10"
                    >
                        <Download size={16} className="group-hover:text-blue-400 group-hover:-translate-y-0.5 transition-all" />
                        <span className="group-hover:text-white transition-colors">Экспорт Excel</span>
                    </button>
                </header>

                {loading ? (
                    <div className="space-y-8 animate-pulse-slow">
                        <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-3 h-48 glass-panel bg-white/5" />
                            <div className="col-span-2 h-48 flex flex-col gap-4">
                                <div className="flex-1 glass-panel bg-white/5" />
                                <div className="flex-1 glass-panel bg-white/5" />
                            </div>
                            <div className="col-span-4 h-48 glass-panel bg-white/5" />
                            <div className="col-span-3 h-48 glass-panel bg-white/5" />
                        </div>
                        <div className="h-96 glass-panel bg-white/5" />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {activeView === 'candidates' && (
                            <div>
                                <div className="grid grid-cols-12 gap-6 mb-8">
                                    {/* Stats & Funnel summary */}
                                    <div className="col-span-3">
                                        <StatCard
                                            title="Всего кандидатов"
                                            value={stats?.total_candidates || 0}
                                            trend="+ 8%"
                                            trendType="up"
                                            className="h-full"
                                            chartData={CHART_DATA}
                                        >
                                            <div className="space-y-4 mt-6">
                                                <div className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold">Новые</span>
                                                    <span className="text-sm font-bold text-blue-400">{stats?.status_breakdown?.['NEW'] || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold">Офферы</span>
                                                    <span className="text-sm font-bold text-green-400">{stats?.status_breakdown?.['OFFER'] || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold">Отказы</span>
                                                    <span className="text-sm font-bold text-red-400">{stats?.status_breakdown?.['REJECTED'] || 0}</span>
                                                </div>
                                            </div>
                                        </StatCard>
                                    </div>

                                    {/* Directions Pie Chart */}
                                    <div className="col-span-4 glass-panel p-6 flex flex-col min-h-[300px]">
                                        <div className="flex items-center gap-2 mb-6">
                                            <PieIcon size={16} className="text-blue-400" />
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Направления (AI Match)</h3>
                                        </div>
                                        <div className="flex-1 min-h-[160px] flex items-center justify-center">
                                            {Object.keys(stats?.vacancy_breakdown || {}).length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={Object.entries(stats?.vacancy_breakdown || {}).map(([id, count]) => ({
                                                                name: id === 'null' ? 'Общая' : (vacancies.find(v => v.id === id)?.title || 'Общая'),
                                                                value: count
                                                            }))}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={45}
                                                            outerRadius={65}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {Object.entries(stats?.vacancy_breakdown || {}).map((_entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={['#5ba1ff', '#ff9d42', '#10b981', '#f87171', '#a78bfa', '#fbbf24'][index % 6]} stroke="none" />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: '#161d29', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                                                            itemStyle={{ color: '#fff' }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">Нет данных</div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4">
                                            {Object.entries(stats?.vacancy_breakdown || {}).slice(0, 4).map(([id, count]: any, idx) => (
                                                <div key={id} className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ['#5ba1ff', '#ff9d42', '#10b981', '#f87171', '#a78bfa', '#fbbf24'][idx % 6] }} />
                                                    <span className="text-[9px] text-gray-400 font-bold truncate max-w-[80px]">{id === 'null' ? 'Общая' : (vacancies.find(v => v.id === id)?.title || 'Общая')}</span>
                                                    <span className="text-[9px] text-white font-black ml-auto">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sources & Formats */}
                                    <div className="col-span-5 grid grid-cols-2 gap-4">
                                        <div className="glass-panel p-5 min-h-[140px] flex flex-col">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Globe size={14} className="text-orange-400" />
                                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Источники</h3>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="space-y-2.5">
                                                    {Object.keys(stats?.platform_breakdown || {}).length > 0 ? (
                                                        Object.entries(stats?.platform_breakdown || {}).map(([platform, count]: any) => (
                                                            <div key={platform} className="flex justify-between items-center group">
                                                                <div className="flex items-center gap-2">
                                                                    {String(platform).toLowerCase().includes('bot') ? <MessageSquare size={10} className="text-blue-400/50" /> :
                                                                        String(platform).toLowerCase().includes('web') ? <Globe size={10} className="text-orange-400/50" /> :
                                                                            <Monitor size={10} className="text-purple-400/50" />}
                                                                    <span className="text-[10px] text-gray-400 group-hover:text-gray-300 transition-colors">
                                                                        {platform === 'unknown' ? 'Telegram Bot' : platform}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[10px] font-black text-white">{count}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="py-4 flex items-center justify-center">
                                                            <span className="text-[9px] text-gray-400 font-bold uppercase animate-pulse">Нет данных</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="glass-panel p-5 min-h-[140px] flex flex-col">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Cpu size={14} className="text-purple-400" />
                                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Форматы файлов</h3>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <div className="space-y-2.5">
                                                    {Object.keys(stats?.file_type_breakdown || {}).length > 0 ? (
                                                        Object.entries(stats?.file_type_breakdown || {}).map(([type, count]: any) => (
                                                            <div key={type} className="flex justify-between items-center group">
                                                                <span className="text-[10px] text-gray-400 uppercase group-hover:text-gray-300 transition-colors font-bold">{type}</span>
                                                                <div className="flex-1 mx-3 h-[2px] bg-white/[0.03] rounded-full overflow-hidden">
                                                                    <div className="h-full bg-blue-500/20" style={{ width: `${(count / (stats?.total_candidates || 1)) * 100}%` }} />
                                                                </div>
                                                                <span className="text-[10px] font-black text-white">{count}</span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="py-4 flex items-center justify-center">
                                                            <span className="text-[9px] text-gray-400 font-bold uppercase animate-pulse">Нет данных</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-10">
                                    <FunnelChart customSteps={funnelSteps} />
                                </div>

                                <CandidateTable
                                    candidates={candidates}
                                    onStatusUpdate={handleStatusUpdate}
                                    onViewDetails={handleViewDetails}
                                    searchTerm={searchTerm}
                                    onSearchChange={setSearchTerm}
                                    statusFilter={statusFilter}
                                    onStatusFilterChange={setStatusFilter}
                                    vacancyFilter={vacancyFilter}
                                    onVacancyFilterChange={setVacancyFilter}
                                    vacancies={vacancies}
                                />
                            </div>
                        )}

                        {activeView === 'vacancies' && (
                            <div className="text-white text-onest">
                                <VacancyTable
                                    vacancies={vacancies as any}
                                    onCreate={handleCreateVacancy}
                                    onUpdate={handleUpdateVacancy}
                                    onDelete={handleDeleteVacancy}
                                />
                            </div>
                        )}

                        {activeView === 'settings' && (
                            <div>
                                <SettingsView />
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Detail Modal Overlay */}
            <AnimatePresence>
                {isModalOpen && selectedCandidate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[#0c121d] w-full max-w-2xl max-h-[90vh] relative rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/5 flex flex-col overflow-hidden pr-0.5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header Section (Fixed) */}
                            <div className="bg-[#161d29] p-7 border-b border-white/5 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-blue-400 font-bold text-xl uppercase">
                                        {selectedCandidate.full_name?.[0] || 'A'}
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">{selectedCandidate.full_name || 'Аноним'}</h2>
                                        <div className="flex items-center gap-3">
                                            <StatusBadge status={selectedCandidate.admin_status} />
                                            {selectedCandidate.resume_path && selectedCandidate.resume_path !== 'none' && (
                                                <button
                                                    onClick={() => handleDownloadResume(selectedCandidate.resume_path)}
                                                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider hover:bg-blue-500/20 transition-all active:scale-95"
                                                    title="Скачать оригинальный файл резюме"
                                                >
                                                    <Download size={12} />
                                                    Резюме
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-white/5 hover:bg-white/10 p-2.5 rounded-2xl transition-all text-gray-400 hover:text-white border border-white/5"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="p-8 space-y-10 text-white">
                                    {/* Grid Info */}
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="flex items-center gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04] min-w-0">
                                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                                                <UserIcon size={20} />
                                            </div>
                                            <div className="min-w-0 overflow-hidden">
                                                <div className="text-[10px] uppercase text-gray-400 font-black tracking-widest mb-0.5">ФИО Кандидата</div>
                                                <div className="text-sm font-bold text-gray-200 truncate" title={selectedCandidate.full_name}>{selectedCandidate.full_name}</div>
                                            </div>
                                        </div>
                                        <div
                                            className="flex items-center gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04] min-w-0 cursor-copy group/email active:scale-[0.98]"
                                            onClick={() => handleCopyEmail(selectedCandidate.email || '')}
                                        >
                                            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 shrink-0 group-hover/email:bg-orange-500/20 transition-colors">
                                                {copied ? <Check size={20} className="animate-in zoom-in duration-200" /> : <Mail size={20} />}
                                            </div>
                                            <div className="min-w-0 overflow-hidden">
                                                <div className="text-[10px] uppercase text-gray-400 font-black tracking-widest mb-0.5 flex items-center gap-2">
                                                    Email почта
                                                    {copied && <span className="text-orange-400 animate-pulse text-[8px]">Скопировано!</span>}
                                                </div>
                                                <div className="text-sm font-bold text-gray-200 truncate group-hover/email:text-white" title={selectedCandidate.email || ''}>{selectedCandidate.email || '—'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04] min-w-0">
                                            <div className="p-3 rounded-xl bg-green-500/10 text-green-400 shrink-0">
                                                <Phone size={20} />
                                            </div>
                                            <div className="min-w-0 overflow-hidden">
                                                <div className="text-[10px] uppercase text-gray-400 font-black tracking-widest mb-0.5">Телефон</div>
                                                <div className="text-sm font-bold text-gray-200 truncate">{selectedCandidate.phone || '—'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 transition-all hover:bg-white/[0.04] min-w-0">
                                            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                                                <Briefcase size={20} />
                                            </div>
                                            <div className="min-w-0 overflow-hidden">
                                                <div className="text-[10px] uppercase text-gray-400 font-black tracking-widest mb-0.5">Позиция / Вакансия</div>
                                                <div className="text-sm font-bold text-gray-200 truncate" title={vacancies.find(v => v.id === selectedCandidate.matched_vacancy_id)?.title || 'Общая'}>
                                                    {vacancies.find(v => v.id === selectedCandidate.matched_vacancy_id)?.title || 'Общая'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skills Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-blue-400 border-b border-white/5 pb-3">
                                            <Code size={18} />
                                            <span className="text-xs font-black uppercase tracking-[0.2em] font-onest">Навыки и технологии</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2.5">
                                            {selectedCandidate.skills_json?.map((skill: string) => (
                                                <span key={skill} className="px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-300 text-[11px] font-bold tracking-wide">
                                                    {skill}
                                                </span>
                                            )) || <span className="text-xs text-gray-600 italic">Навыки не указаны</span>}
                                        </div>
                                    </div>

                                    {/* About Me Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-orange-400 border-b border-white/5 pb-3">
                                            <FileText size={18} />
                                            <span className="text-xs font-black uppercase tracking-[0.2em] font-onest">Обо мне / Опыт (AI)</span>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 text-sm text-gray-300 leading-relaxed font-medium min-h-[100px] whitespace-pre-wrap">
                                            {selectedCandidate.raw_text || selectedCandidate.summary || <span className="text-gray-600 italic">Описание отсутствует</span>}
                                        </div>
                                    </div>

                                    {/* Recruiter Notes */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                            <div className="flex items-center gap-2 text-yellow-400">
                                                <StickyNote size={18} />
                                                <span className="text-xs font-black uppercase tracking-[0.2em] font-onest">Заметки рекрутера</span>
                                            </div>
                                            <button
                                                onClick={() => handleUpdateCandidate(String(selectedCandidate.id), { admin_notes: notes })}
                                                className="text-[10px] uppercase font-black text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-all"
                                            >
                                                <Save size={12} /> Сохранить
                                            </button>
                                        </div>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Введите важные детали, комментарии после интервью или Soft Skills кандидата..."
                                            className="w-full h-32 bg-white/[0.02] border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-blue-500/50 transition-all resize-none text-gray-300 placeholder:text-gray-700 leading-relaxed font-medium"
                                        />
                                    </div>

                                    {/* Experience */}
                                    <div className="flex items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-orange-500/5 to-transparent border border-orange-500/10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400">
                                                <Clock size={20} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-[10px] uppercase text-gray-400 font-black tracking-widest">Профессиональный опыт</div>
                                                <div className="text-lg font-bold text-gray-200">
                                                    {getYearString(selectedCandidate.experience_years || 0)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Control */}
                                    <div className="pt-8 border-t border-white/5">
                                        <div className="flex items-center justify-between p-7 rounded-[2rem] bg-white/[0.02] border border-white/5">
                                            <div className="space-y-1.5">
                                                <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.15em]">Текущий этап</h3>
                                                <p className="text-[11px] text-gray-400/80 font-medium">Обновите статус для продвижения по воронке</p>
                                            </div>
                                            <div className="relative">
                                                <select
                                                    className="bg-[#161d29] border border-white/10 rounded-2xl px-6 py-3.5 text-xs font-black outline-none cursor-pointer hover:border-blue-500/50 transition-all appearance-none pr-12 text-blue-400 shadow-xl"
                                                    value={selectedCandidate.admin_status}
                                                    onChange={(e) => {
                                                        handleUpdateCandidate(String(selectedCandidate.id), { admin_status: e.target.value });
                                                    }}
                                                >
                                                    <option value="NEW">Новый отклик</option>
                                                    <option value="VIEWED">Просмотрен</option>
                                                    <option value="INVITED">Приглашен</option>
                                                    <option value="INTERVIEW">Интервью</option>
                                                    <option value="TEST_TASK">Тестовое задание</option>
                                                    <option value="OFFER">Оффер</option>
                                                    <option value="HIRED">Принят в штат</option>
                                                    <option value="REJECTED">Отказ</option>
                                                    <option value="ARCHIVE">Архив</option>
                                                </select>
                                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400/50" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPage;
