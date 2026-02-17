
import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { StatCard } from '../components/StatCard';
import { FunnelChart } from '../components/FunnelChart';
import { CandidateTable } from '../components/CandidateTable';
import { VacancyTable } from '../components/VacancyTable';
import { ReportsView } from '../components/ReportsView';
import { SettingsView } from '../components/SettingsView';
import { Candidate } from '../types';
import axios from 'axios';
import { User, Mail, Phone, Clock, Briefcase, FileText, Code, X, Download } from 'lucide-react';

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

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [vacancyFilter, setVacancyFilter] = useState('ALL');

    // Modal State
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name || 'A')}&background=random`
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

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await axios.patch(`/api/admin/candidates/${id}`, { admin_status: status });
            fetchData();
            if (selectedCandidate && String(selectedCandidate.id) === id) {
                setSelectedCandidate({ ...selectedCandidate, admin_status: status });
            }
        } catch (err) {
            console.error('Update failed:', err);
        }
    };

    const handleViewDetails = async (id: string) => {
        try {
            const resp = await axios.get(`/api/admin/candidates/${id}`);
            setSelectedCandidate(resp.data);
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

    const handleExport = () => {
        window.open('/api/admin/export', '_blank');
    };

    const funnelSteps = stats ? [
        { label: 'Отклики', count: stats.total_candidates, pct: '100%', color: 'rgba(59, 130, 246, 0.8)' },
        {
            label: 'Просмотры',
            count: (stats.status_breakdown['VIEWED'] || 0) + (stats.status_breakdown['INTERVIEW'] || 0) + (stats.status_breakdown['TEST_TASK'] || 0) + (stats.status_breakdown['OFFER'] || 0) + (stats.status_breakdown['HIRED'] || 0),
            pct: stats.total_candidates ? Math.round((((stats.status_breakdown['VIEWED'] || 0) + (stats.status_breakdown['INTERVIEW'] || 0) + (stats.status_breakdown['TEST_TASK'] || 0) + (stats.status_breakdown['OFFER'] || 0) + (stats.status_breakdown['HIRED'] || 0)) / stats.total_candidates) * 100) + '%' : '0%',
            color: 'rgba(59, 130, 246, 0.6)'
        },
        {
            label: 'Интервью',
            count: (stats.status_breakdown['INTERVIEW'] || 0) + (stats.status_breakdown['TEST_TASK'] || 0) + (stats.status_breakdown['OFFER'] || 0) + (stats.status_breakdown['HIRED'] || 0),
            pct: stats.total_candidates ? Math.round((((stats.status_breakdown['INTERVIEW'] || 0) + (stats.status_breakdown['TEST_TASK'] || 0) + (stats.status_breakdown['OFFER'] || 0) + (stats.status_breakdown['HIRED'] || 0)) / stats.total_candidates) * 100) + '%' : '0%',
            color: 'rgba(59, 130, 246, 0.4)'
        },
        {
            label: 'Офферы',
            count: (stats.status_breakdown['OFFER'] || 0) + (stats.status_breakdown['HIRED'] || 0),
            pct: stats.total_candidates ? Math.round((((stats.status_breakdown['OFFER'] || 0) + (stats.status_breakdown['HIRED'] || 0)) / stats.total_candidates) * 100) + '%' : '0%',
            color: 'rgba(59, 130, 246, 0.2)'
        },
        { label: 'Найм', count: stats.status_breakdown['HIRED'] || 0, pct: stats.total_candidates ? Math.round(((stats.status_breakdown['HIRED'] || 0) / stats.total_candidates) * 100) + '%' : '0%', color: 'rgba(16, 185, 129, 0.8)' },
    ] : [];

    return (
        <div className="flex min-h-screen circuit-bg">
            <Sidebar activeView={activeView} onViewChange={setActiveView} />

            <main className="flex-1 ml-80 p-8 overflow-y-auto font-onest">
                <div className="flex justify-between items-center mb-10">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
                        Админка HR-Magnet
                    </h1>
                    <button
                        onClick={handleExport}
                        className="glass-panel px-6 py-2.5 text-sm font-semibold hover:bg-white/10 hover-glow transition-all flex items-center gap-2"
                    >
                        <Download size={16} /> Экспорт Excel
                    </button>
                </div>

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
                    <>
                        {activeView === 'candidates' && (
                            <div>
                                <div className="grid grid-cols-12 gap-6 mb-8">
                                    <div className="col-span-3">
                                        <StatCard
                                            title="Всего кандидатов"
                                            value={stats?.total_candidates || 0}
                                            trend="+ 8%"
                                            trendType="up"
                                            chartData={CHART_DATA}
                                        >
                                        </StatCard>
                                    </div>

                                    <div className="col-span-2 flex flex-col gap-4">
                                        <StatCard title="Новые заявки" value={stats?.status_breakdown['NEW'] || 0} trend="+14% today" trendType="up" className="flex-1" />
                                        <StatCard title="Приглашено" value={stats?.status_breakdown['INVITED'] || 0} className="flex-1" />
                                    </div>

                                    <div className="col-span-4">
                                        <FunnelChart customSteps={funnelSteps} />
                                    </div>

                                    <div className="col-span-3 flex flex-col gap-4">
                                        <StatCard
                                            title="Процент отказов"
                                            value={stats?.total_candidates ? Math.round(((stats.status_breakdown['REJECTED'] || 0) / stats.total_candidates) * 100) + '%' : '0%'}
                                            trendType="down"
                                            className="flex-1"
                                        >
                                            <div className="h-1 bg-white/10 rounded-full mt-4 overflow-hidden">
                                                <div
                                                    className="h-full bg-red-400 transition-all duration-500"
                                                    style={{ width: stats?.total_candidates ? ((stats.status_breakdown['REJECTED'] || 0) / stats.total_candidates) * 100 + '%' : '0%' }}
                                                />
                                            </div>
                                        </StatCard>

                                        <div className="glass-panel p-5 flex-1 overflow-hidden">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Статистика источников</h3>
                                            <div className="space-y-3">
                                                {stats && Object.entries(stats.source_breakdown).map(([src, count]: any) => (
                                                    <div key={src} className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-400 capitalize">{src}</span>
                                                        <span className="text-xs font-bold">{count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
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

                        {activeView === 'reports' && (
                            <div>
                                <ReportsView stats={stats} />
                            </div>
                        )}

                        {activeView === 'settings' && (
                            <div>
                                <SettingsView />
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Detail Modal */}
            {isModalOpen && selectedCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-[#05080f]/80 backdrop-blur-md p-6 border-b border-white/10 flex justify-between items-center z-10">
                            <h2 className="text-2xl font-bold">{selectedCandidate.full_name || 'Аноним'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 text-white">
                            {/* Profile Card */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                    <User className="text-blue-400" size={20} />
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 font-bold">ФИО</div>
                                        <div className="text-sm font-medium">{selectedCandidate.full_name}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                    <Mail className="text-orange-400" size={20} />
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 font-bold">Email</div>
                                        <div className="text-sm font-medium">{selectedCandidate.email || '—'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                    <Phone className="text-green-400" size={20} />
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 font-bold">Телефон</div>
                                        <div className="text-sm font-medium">{selectedCandidate.phone || '—'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                    <Briefcase className="text-purple-400" size={20} />
                                    <div>
                                        <div className="text-[10px] uppercase text-gray-500 font-bold">Вакансия</div>
                                        <div className="text-sm font-medium">{vacancies.find(v => v.id === selectedCandidate.matched_vacancy_id)?.title || 'Общая'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <Code size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wider text-onest">Навыки</span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-onest">
                                    {selectedCandidate.skills_json?.map((skill: string) => (
                                        <span key={skill} className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                                            {skill}
                                        </span>
                                    )) || <span className="text-xs text-gray-500">Не указаны</span>}
                                </div>
                            </div>

                            {/* Experience */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-orange-400">
                                    <Clock size={18} />
                                    <span className="text-xs font-bold uppercase tracking-wider text-onest">Опыт работы</span>
                                </div>
                                <div className="text-sm text-gray-300">{selectedCandidate.experience_years} лет</div>
                            </div>

                            {/* Summary */}
                            {selectedCandidate.summary && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <FileText size={18} />
                                        <span className="text-xs font-bold uppercase tracking-wider text-onest">О кандидате</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {selectedCandidate.summary}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-4 pt-4 border-t border-white/10">
                                <button
                                    onClick={() => { handleStatusUpdate(String(selectedCandidate.id), 'INVITED'); setIsModalOpen(false); }}
                                    className="flex-1 py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 font-bold transition-all text-onest"
                                >
                                    Пригласить
                                </button>
                                <button
                                    onClick={() => { handleStatusUpdate(String(selectedCandidate.id), 'REJECTED'); setIsModalOpen(false); }}
                                    className="flex-1 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold transition-all text-onest"
                                >
                                    Отклонить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
