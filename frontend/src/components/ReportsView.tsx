
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { StatCard } from './StatCard';

interface ReportsViewProps {
    stats: any;
}

const COLORS = ['#3b82f6', '#fe830c', '#4c51c6', '#10b981', '#f43f5e'];

export const ReportsView: React.FC<ReportsViewProps> = ({ stats }) => {
    if (!stats) return <div className="p-12 text-center opacity-50">Загрузка статистики...</div>;

    const sourceData = Object.entries(stats.source_breakdown).map(([name, value]) => ({ name, value }));
    const statusLabels: Record<string, string> = {
        NEW: 'Новые',
        VIEWED: 'Просм.',
        INTERVIEW: 'Интервью',
        TEST_TASK: 'Тест',
        OFFER: 'Оффер',
        HIRED: 'Найм',
        REJECTED: 'Отказ',
        ARCHIVE: 'Архив'
    };

    const statusData = Object.entries(stats.status_breakdown).map(([name, value]) => ({
        name: statusLabels[name] || name,
        value
    }));

    const interviewCount = (stats.status_breakdown['INTERVIEW'] || 0) +
        (stats.status_breakdown['TEST_TASK'] || 0) +
        (stats.status_breakdown['OFFER'] || 0) +
        (stats.status_breakdown['HIRED'] || 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Аналитические отчеты</h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Sources Chart */}
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Источники кандидатов</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={sourceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {sourceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="glass-panel p-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Распределение по статусам</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={statusData}>
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                <YAxis stroke="#64748b" fontSize={10} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Numerical Summary */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard title="Конверсия в интервью" value={(stats.total_candidates ? Math.round((interviewCount / stats.total_candidates) * 100) : 0) + '%'} />
                <StatCard title="Всего заявок" value={stats.total_candidates} />
                <StatCard title="С фото (Vision AI)" value={stats.source_breakdown['file'] || 0} />
                <StatCard title="Ручной ввод" value={stats.source_breakdown['manual'] || 0} />
            </div>
        </div>
    );
};
