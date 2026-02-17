import { useState, useEffect } from 'react'
import { Check, X, Search, ExternalLink, Download, ChevronDown, User, Mail, Phone, Briefcase, Code, FileText, Clock, MessageSquare } from 'lucide-react'

type Candidate = {
    id: number
    full_name: string
    email: string
    phone: string
    admin_status: string
    matched_vacancy_id: string
    source: string
    created_at: string
}

type CandidateDetail = {
    id: number
    telegram_id: number | null
    full_name: string
    phone: string
    email: string
    source: string
    summary: string
    skills_json: string[] | null
    experience_years: number
    matched_vacancy_id: string
    resume_path: string | null
    admin_status: string
    admin_notes: string | null
    quiz_results: Record<string, unknown> | null
    created_at: string
}

type Stats = {
    total_candidates: number
    status_breakdown: Record<string, number>
    source_breakdown: Record<string, number>
}

type Vacancy = {
    id: string
    title: string
    tags_json: string[]
    is_active: number
    created_at: string
}

export default function AdminDashboard() {
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [vacancyFilter, setVacancyFilter] = useState('ALL')
    const [activeTab, setActiveTab] = useState<'candidates' | 'vacancies'>('candidates')

    // Vacancies state
    const [vacancies, setVacancies] = useState<Vacancy[]>([])
    const [vacancyModalOpen, setVacancyModalOpen] = useState(false)
    const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null)
    const [newVacId, setNewVacId] = useState('')
    const [newVacTitle, setNewVacTitle] = useState('')
    const [newVacTags, setNewVacTags] = useState('')

    // Detail modal state
    const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalLoading, setModalLoading] = useState(false)
    const [adminNotes, setAdminNotes] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    // Re-fetch candidates when filters change
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchCandidates()
        }, 300)  // debounce search
        return () => clearTimeout(timeout)
    }, [searchTerm, statusFilter, vacancyFilter])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [candResp, statsResp, vacResp] = await Promise.all([
                fetch('/api/admin/candidates?limit=100'),
                fetch('/api/admin/stats'),
                fetch('/api/admin/vacancies')
            ])
            const candData = await candResp.json()
            const statsData = await statsResp.json()
            const vacData = await vacResp.json()

            setCandidates(candData.items)
            setStats(statsData)
            setVacancies(vacData)
        } catch (err) {
            console.error('Failed to fetch admin data:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchCandidates = async () => {
        try {
            const params = new URLSearchParams({ limit: '100' })
            if (searchTerm.trim()) params.set('search', searchTerm.trim())
            if (statusFilter !== 'ALL') params.set('status', statusFilter)
            if (vacancyFilter !== 'ALL') params.set('vacancy_id', vacancyFilter)

            const resp = await fetch(`/api/admin/candidates?${params.toString()}`)
            const data = await resp.json()
            setCandidates(data.items)
        } catch (err) {
            console.error('Failed to fetch candidates:', err)
        }
    }

    const updateStatus = async (id: number, status: string) => {
        try {
            await fetch(`/api/admin/candidates/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_status: status })
            })
            fetchData()
            // Also update modal if open
            if (selectedCandidate?.id === id) {
                setSelectedCandidate(prev => prev ? { ...prev, admin_status: status } : null)
            }
        } catch (err) {
            console.error('Failed to update status', err)
        }
    }

    const saveNotes = async (id: number) => {
        try {
            await fetch(`/api/admin/candidates/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_notes: adminNotes })
            })
            setSelectedCandidate(prev => prev ? { ...prev, admin_notes: adminNotes } : null)
        } catch (err) {
            console.error('Failed to save notes', err)
        }
    }

    const openCandidateDetail = async (id: number) => {
        setModalOpen(true)
        setModalLoading(true)
        try {
            const resp = await fetch(`/api/admin/candidates/${id}`)
            if (!resp.ok) throw new Error('Not found')
            const data = await resp.json()
            setSelectedCandidate(data)
            setAdminNotes(data.admin_notes || '')
        } catch (err) {
            console.error('Failed to load candidate detail:', err)
        } finally {
            setModalLoading(false)
        }
    }

    const closeModal = () => {
        setModalOpen(false)
        setSelectedCandidate(null)
    }

    const handleExportExcel = () => {
        // Trigger file download
        window.open('/api/admin/export', '_blank')
    }

    // Server-side filtering is now handled by fetchCandidates()
    const filteredCandidates = candidates

    const statusLabel = (s: string) => {
        switch (s) {
            case 'NEW': return 'НОВЫЙ'
            case 'VIEWED': return 'ПРОСМОТРЕН'
            case 'INVITED': return 'ПРИГЛАШЁН'
            case 'REJECTED': return 'ОТКАЗ'
            default: return s
        }
    }

    const statusColor = (s: string): { bg: string; text: string; border: string } => {
        switch (s) {
            case 'NEW': return { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' }
            case 'VIEWED': return { bg: 'rgba(234,179,8,0.15)', text: '#facc15', border: 'rgba(234,179,8,0.3)' }
            case 'INVITED': return { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' }
            case 'REJECTED': return { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' }
            default: return { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af', border: 'rgba(107,114,128,0.3)' }
        }
    }

    const sourceLabel = (s: string) => {
        switch (s) {
            case 'file': return '📄 Файл'
            case 'manual': return '✍️ Вручную'
            case 'telegram': return '🤖 Telegram'
            default: return s
        }
    }

    const vacancyLabel = (v: string) => {
        const found = vacancies.find(vac => vac.id === v)
        return found?.title || v || 'Общая'
    }

    const saveVacancy = async () => {
        const payload = {
            id: newVacId,
            title: newVacTitle,
            tags_json: newVacTags.split(',').map(t => t.trim()).filter(t => t),
        }

        try {
            const url = editingVacancy
                ? `/api/admin/vacancies/${editingVacancy.id}`
                : `/api/admin/vacancies`

            const resp = await fetch(url, {
                method: editingVacancy ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!resp.ok) {
                const err = await resp.json()
                alert(err.detail || 'Error saving vacancy')
                return
            }

            setVacancyModalOpen(false)
            fetchData()
        } catch (err) {
            console.error('Failed to save vacancy', err)
        }
    }

    const deleteVacancy = async (id: string) => {
        if (!confirm('Вы уверены? Удаление вакансии не удалит кандидатов, но связь пропадет.')) return
        try {
            await fetch(`/api/admin/vacancies/${id}`, { method: 'DELETE' })
            fetchData()
        } catch (err) {
            console.error('Failed to delete vacancy', err)
        }
    }

    const openVacancyModal = (v?: Vacancy) => {
        if (v) {
            setEditingVacancy(v)
            setNewVacId(v.id)
            setNewVacTitle(v.title)
            setNewVacTags(v.tags_json.join(', '))
        } else {
            setEditingVacancy(null)
            setNewVacId('')
            setNewVacTitle('')
            setNewVacTags('')
        }
        setVacancyModalOpen(true)
    }

    if (loading && !candidates.length) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                <div style={{ textAlign: 'center' }} className="animate-fade-in-up">
                    <div style={{ fontSize: 48, marginBottom: 16 }} className="animate-float">⚙️</div>
                    <p style={{ fontSize: 17, fontWeight: 700, opacity: 0.5 }}>Загрузка дашборда...</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: "'Onest', sans-serif" }}>
            <div className="admin-container animate-fade-in-up">

                {/* ─── Header ─── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-orange)', marginBottom: 4 }}>
                            ⚡ Админка HR-Magnet
                        </h1>
                        <p style={{ fontSize: 14, opacity: 0.5 }}>
                            Управление вакансиями и кандидатами
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            onClick={() => openVacancyModal()}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 20px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                                color: '#fff', fontWeight: 600, fontSize: 14,
                                cursor: 'pointer', transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                        >
                            + Добавить вакансию
                        </button>
                        <button
                            onClick={handleExportExcel}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 20px',
                                background: 'var(--accent-blue)',
                                border: 'none', borderRadius: 12,
                                color: '#fff', fontWeight: 600, fontSize: 14,
                                cursor: 'pointer', transition: 'opacity 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                            <Download size={16} /> Экспорт Excel
                        </button>
                    </div>
                </div>

                {/* ─── Tabs ─── */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 14, width: 'fit-content' }}>
                    <button
                        onClick={() => setActiveTab('candidates')}
                        style={{
                            padding: '8px 20px', borderRadius: 10, border: 'none',
                            background: activeTab === 'candidates' ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: activeTab === 'candidates' ? '#fff' : 'rgba(255,255,255,0.4)',
                            fontWeight: 600, fontSize: 14, cursor: 'pointer',
                        }}
                    >
                        Кандидаты
                    </button>
                    <button
                        onClick={() => setActiveTab('vacancies')}
                        style={{
                            padding: '8px 20px', borderRadius: 10, border: 'none',
                            background: activeTab === 'vacancies' ? 'rgba(255,255,255,0.08)' : 'transparent',
                            color: activeTab === 'vacancies' ? '#fff' : 'rgba(255,255,255,0.4)',
                            fontWeight: 600, fontSize: 14, cursor: 'pointer',
                        }}
                    >
                        Вакансии
                    </button>
                </div>

                {/* ─── Stats Grid ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                    <div className="glass" style={{ padding: 24 }}>
                        <p style={{ fontSize: 12, opacity: 0.4, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Всего кандидатов</p>
                        <p style={{ fontSize: 32, fontWeight: 800 }}>{stats?.total_candidates || 0}</p>
                    </div>
                    <div className="glass" style={{ padding: 24 }}>
                        <p style={{ fontSize: 12, opacity: 0.4, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Новые заявки</p>
                        <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-orange)' }}>{stats?.status_breakdown['NEW'] || 0}</p>
                    </div>
                    <div className="glass" style={{ padding: 24 }}>
                        <p style={{ fontSize: 12, opacity: 0.4, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Приглашено</p>
                        <p style={{ fontSize: 32, fontWeight: 800, color: '#00cec9' }}>{stats?.status_breakdown['INVITED'] || 0}</p>
                    </div>
                    <div className="glass" style={{ padding: 24 }}>
                        <p style={{ fontSize: 12, opacity: 0.4, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Процент отказов</p>
                        <p style={{ fontSize: 32, fontWeight: 800, color: '#ef4444' }}>
                            {stats?.total_candidates ? Math.round(((stats.status_breakdown['REJECTED'] || 0) / stats.total_candidates) * 100) : 0}%
                        </p>
                    </div>
                </div>

                {activeTab === 'candidates' ? (
                    <>
                        {/* ─── Search & Filter ─── */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                                <Search style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} size={18} />
                                <input
                                    type="text"
                                    placeholder="Поиск по имени, email, навыкам..."
                                    className="input-field"
                                    style={{ paddingLeft: 42 }}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div style={{ position: 'relative', minWidth: 180 }}>
                                <select
                                    className="input-field"
                                    style={{
                                        width: '100%',
                                        paddingRight: 40,
                                        appearance: 'none',
                                        WebkitAppearance: 'none',
                                        cursor: 'pointer',
                                    }}
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                >
                                    <option value="ALL">Все статусы</option>
                                    <option value="NEW">Новый</option>
                                    <option value="VIEWED">Просмотрен</option>
                                    <option value="INVITED">Приглашён</option>
                                    <option value="REJECTED">Отказ</option>
                                </select>
                                <ChevronDown
                                    size={16}
                                    style={{
                                        position: 'absolute',
                                        right: 14,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        opacity: 0.4,
                                        pointerEvents: 'none',
                                    }}
                                />
                            </div>
                            <div style={{ position: 'relative', minWidth: 200 }}>
                                <select
                                    className="input-field"
                                    style={{
                                        width: '100%',
                                        paddingRight: 40,
                                        appearance: 'none',
                                        WebkitAppearance: 'none',
                                        cursor: 'pointer',
                                    }}
                                    value={vacancyFilter}
                                    onChange={e => setVacancyFilter(e.target.value)}
                                >
                                    <option value="ALL">Все вакансии</option>
                                    {vacancies.map(v => (
                                        <option key={v.id} value={v.id}>{v.title}</option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={16}
                                    style={{
                                        position: 'absolute',
                                        right: 14,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        opacity: 0.4,
                                        pointerEvents: 'none',
                                    }}
                                />
                            </div>
                        </div>

                        {/* ─── Candidates Table ─── */}
                        <div className="glass" style={{ overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            {['Кандидат', 'Роль', 'Источник', 'Статус', 'Дата', 'Действия'].map((h, i) => (
                                                <th key={h} style={{
                                                    padding: '16px 20px', fontSize: 12, fontWeight: 700, opacity: 0.4,
                                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                                    textAlign: i === 5 ? 'right' : 'left',
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCandidates.length === 0 && (
                                            <tr>
                                                <td colSpan={6} style={{ padding: 48, textAlign: 'center', opacity: 0.3, fontSize: 14 }}>
                                                    Кандидаты не найдены
                                                </td>
                                            </tr>
                                        )}
                                        {filteredCandidates.map(c => {
                                            const sc = statusColor(c.admin_status)
                                            return (
                                                <tr
                                                    key={c.id}
                                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    {/* Candidate info */}
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                                                            {c.full_name || 'Аноним'}
                                                        </div>
                                                        <div style={{ fontSize: 12, opacity: 0.4 }}>
                                                            {c.email || c.phone || '—'}
                                                        </div>
                                                    </td>

                                                    {/* Role/Vacancy */}
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span style={{
                                                            fontSize: 12, fontWeight: 600, padding: '4px 10px',
                                                            borderRadius: 8,
                                                            background: 'rgba(254, 131, 12, 0.1)',
                                                            border: '1px solid rgba(254, 131, 12, 0.2)',
                                                            color: 'var(--accent-orange)',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            {vacancyLabel(c.matched_vacancy_id)}
                                                        </span>
                                                    </td>

                                                    {/* Source */}
                                                    <td style={{ padding: '14px 20px', fontSize: 13, opacity: 0.6 }}>
                                                        {sourceLabel(c.source)}
                                                    </td>

                                                    {/* Status */}
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span style={{
                                                            fontSize: 11, fontWeight: 700, padding: '4px 10px',
                                                            borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em',
                                                            border: `1px solid ${sc.border}`,
                                                            background: sc.bg,
                                                            color: sc.text,
                                                        }}>
                                                            {statusLabel(c.admin_status)}
                                                        </span>
                                                    </td>

                                                    {/* Date */}
                                                    <td style={{ padding: '14px 20px', fontSize: 13, opacity: 0.4 }}>
                                                        {new Date(c.created_at).toLocaleDateString('ru-RU')}
                                                    </td>

                                                    {/* Actions */}
                                                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                                            <button
                                                                onClick={() => updateStatus(c.id, 'INVITED')}
                                                                title="Пригласить"
                                                                style={{
                                                                    padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer',
                                                                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981',
                                                                    transition: 'background 0.15s',
                                                                }}
                                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)')}
                                                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)')}
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => updateStatus(c.id, 'REJECTED')}
                                                                title="Отклонить"
                                                                style={{
                                                                    padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer',
                                                                    background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                                                    transition: 'background 0.15s',
                                                                }}
                                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)')}
                                                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => openCandidateDetail(c.id)}
                                                                title="Подробнее"
                                                                style={{
                                                                    padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer',
                                                                    background: 'rgba(76, 81, 198, 0.1)', color: 'var(--accent-light)',
                                                                    transition: 'background 0.15s',
                                                                }}
                                                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(76, 81, 198, 0.25)')}
                                                                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(76, 81, 198, 0.1)')}
                                                            >
                                                                <ExternalLink size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="glass" style={{ overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        {['ID', 'Название', 'Теги', 'Действия'].map((h, i) => (
                                            <th key={h} style={{
                                                padding: '16px 20px', fontSize: 12, fontWeight: 700, opacity: 0.4,
                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                                textAlign: i === 3 ? 'right' : 'left',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {vacancies.length === 0 && (
                                        <tr>
                                            <td colSpan={4} style={{ padding: 48, textAlign: 'center', opacity: 0.3, fontSize: 14 }}>
                                                Вакансии не добавлены
                                            </td>
                                        </tr>
                                    )}
                                    {vacancies.map(v => (
                                        <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '14px 20px', fontSize: 13, fontFamily: 'monospace', opacity: 0.5 }}>{v.id}</td>
                                            <td style={{ padding: '14px 20px', fontWeight: 700 }}>{v.title}</td>
                                            <td style={{ padding: '14px 20px' }}>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                    {v.tags_json.map(t => (
                                                        <span key={t} style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>{t}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                                    <button
                                                        onClick={() => openVacancyModal(v)}
                                                        style={{ padding: 8, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer' }}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => deleteVacancy(v.id)}
                                                        style={{ padding: 8, borderRadius: 8, border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer' }}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ─── Footer ─── */}
                <div style={{ textAlign: 'center', padding: '32px 0 16px', fontSize: 12, opacity: 0.2 }}>
                    HR-Magnet Admin · {filteredCandidates.length} из {candidates.length} кандидатов
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ─── Candidate Detail Modal ─── */}
            {/* ═══════════════════════════════════════════════════════ */}
            {modalOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)',
                        padding: 16,
                    }}
                    onClick={e => { if (e.target === e.currentTarget) closeModal() }}
                >
                    <div
                        className="glass animate-fade-in-up"
                        style={{
                            width: '100%', maxWidth: 640, maxHeight: '90vh',
                            overflowY: 'auto', borderRadius: 24,
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        {modalLoading ? (
                            <div style={{ padding: 64, textAlign: 'center' }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }} className="animate-float">⏳</div>
                                <p style={{ opacity: 0.5 }}>Загрузка...</p>
                            </div>
                        ) : selectedCandidate && (
                            <>
                                {/* Modal Header */}
                                <div style={{
                                    padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <div>
                                        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>
                                            {selectedCandidate.full_name || 'Аноним'}
                                        </h2>
                                        <p style={{ fontSize: 13, opacity: 0.4 }}>
                                            ID #{selectedCandidate.id} · {sourceLabel(selectedCandidate.source)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        style={{
                                            width: 36, height: 36, borderRadius: 10, border: 'none',
                                            background: 'rgba(255,255,255,0.05)', color: '#fff',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 18, transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div style={{ padding: '24px 28px' }}>

                                    {/* Status row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                                        <span style={{ fontSize: 13, opacity: 0.5, marginRight: 4 }}>Статус:</span>
                                        {(['NEW', 'VIEWED', 'INVITED', 'REJECTED'] as const).map(s => {
                                            const sc = statusColor(s)
                                            const isActive = selectedCandidate.admin_status === s
                                            return (
                                                <button
                                                    key={s}
                                                    onClick={() => updateStatus(selectedCandidate.id, s)}
                                                    style={{
                                                        fontSize: 11, fontWeight: 700, padding: '5px 12px',
                                                        borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em',
                                                        border: `1px solid ${isActive ? sc.border : 'rgba(255,255,255,0.06)'}`,
                                                        background: isActive ? sc.bg : 'transparent',
                                                        color: isActive ? sc.text : 'rgba(255,255,255,0.3)',
                                                        cursor: 'pointer', transition: 'all 0.15s',
                                                    }}
                                                >
                                                    {statusLabel(s)}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    {/* Contact Info Grid */}
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24,
                                    }}>
                                        {/* Name */}
                                        <InfoRow icon={<User size={15} />} label="ФИО" value={selectedCandidate.full_name || '—'} />
                                        {/* Email */}
                                        <InfoRow icon={<Mail size={15} />} label="Email" value={selectedCandidate.email || '—'} />
                                        {/* Phone */}
                                        <InfoRow icon={<Phone size={15} />} label="Телефон" value={selectedCandidate.phone || '—'} />
                                        {/* Experience */}
                                        <InfoRow icon={<Clock size={15} />} label="Опыт" value={selectedCandidate.experience_years ? `${selectedCandidate.experience_years} лет` : '—'} />
                                        {/* Vacancy */}
                                        <InfoRow icon={<Briefcase size={15} />} label="Вакансия" value={vacancyLabel(selectedCandidate.matched_vacancy_id)} highlight />
                                        {/* Source */}
                                        <InfoRow icon={<FileText size={15} />} label="Источник" value={sourceLabel(selectedCandidate.source)} />
                                    </div>

                                    {/* Skills */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                            <Code size={15} style={{ opacity: 0.5 }} />
                                            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.5 }}>
                                                Навыки
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                            {selectedCandidate.skills_json && selectedCandidate.skills_json.length > 0 ? (
                                                selectedCandidate.skills_json.map(skill => (
                                                    <span
                                                        key={skill}
                                                        style={{
                                                            fontSize: 12, fontWeight: 600, padding: '5px 14px',
                                                            borderRadius: 20,
                                                            background: 'rgba(76, 81, 198, 0.12)',
                                                            border: '1px solid rgba(76, 81, 198, 0.25)',
                                                            color: 'var(--accent-light)',
                                                        }}
                                                    >
                                                        {skill}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ fontSize: 13, opacity: 0.3 }}>Не указаны</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Summary / About */}
                                    {selectedCandidate.summary && (
                                        <div style={{ marginBottom: 24 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                                <FileText size={15} style={{ opacity: 0.5 }} />
                                                <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.5 }}>
                                                    О кандидате
                                                </span>
                                            </div>
                                            <p style={{
                                                fontSize: 14, lineHeight: 1.7, opacity: 0.7,
                                                padding: 16, borderRadius: 12,
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.04)',
                                                whiteSpace: 'pre-line',
                                            }}>
                                                {selectedCandidate.summary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Resume file — downloadable */}
                                    {selectedCandidate.resume_path && (
                                        <div
                                            onClick={() => window.open(`/api/admin/resume/${encodeURIComponent(selectedCandidate.resume_path!)}`, '_blank')}
                                            style={{
                                                marginBottom: 24, padding: 14, borderRadius: 12,
                                                background: 'rgba(254, 131, 12, 0.06)',
                                                border: '1px solid rgba(254, 131, 12, 0.15)',
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = 'rgba(254, 131, 12, 0.12)';
                                                e.currentTarget.style.borderColor = 'rgba(254, 131, 12, 0.3)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'rgba(254, 131, 12, 0.06)';
                                                e.currentTarget.style.borderColor = 'rgba(254, 131, 12, 0.15)';
                                            }}
                                        >
                                            <Download size={18} color="var(--accent-orange)" />
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-orange)' }}>
                                                    Скачать резюме:
                                                </span>
                                                <span style={{ fontSize: 13, opacity: 0.6, marginLeft: 8 }}>
                                                    {selectedCandidate.resume_path.replace(/^[a-f0-9]+_/, '')}
                                                </span>
                                            </div>
                                            <ExternalLink size={14} style={{ opacity: 0.4 }} />
                                        </div>
                                    )}

                                    {/* Admin Notes */}
                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                            <MessageSquare size={15} style={{ opacity: 0.5 }} />
                                            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.5 }}>
                                                Заметки админа
                                            </span>
                                        </div>
                                        <textarea
                                            className="input-field"
                                            rows={3}
                                            style={{ resize: 'vertical', marginBottom: 8 }}
                                            placeholder="Добавьте заметку о кандидате..."
                                            value={adminNotes}
                                            onChange={e => setAdminNotes(e.target.value)}
                                        />
                                        <button
                                            onClick={() => saveNotes(selectedCandidate.id)}
                                            style={{
                                                padding: '8px 20px', borderRadius: 10,
                                                border: 'none', cursor: 'pointer',
                                                background: 'var(--accent-blue)', color: '#fff',
                                                fontWeight: 600, fontSize: 13,
                                                transition: 'opacity 0.15s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                        >
                                            💾 Сохранить заметки
                                        </button>
                                    </div>

                                    {/* Meta info */}
                                    <div style={{
                                        padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.04)',
                                        display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.3,
                                    }}>
                                        <span>Создан: {new Date(selectedCandidate.created_at).toLocaleString('ru-RU')}</span>
                                        {selectedCandidate.telegram_id && (
                                            <span>Telegram ID: {selectedCandidate.telegram_id}</span>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Vacancy Modal ─── */}
            {vacancyModalOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blue(8px)', padding: 16,
                    }}
                >
                    <div className="glass" style={{ width: '100%', maxWidth: 480, padding: 32, borderRadius: 24 }}>
                        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
                            {editingVacancy ? '✏️ Редактировать вакансию' : '✨ Новая вакансия'}
                        </h2>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 13, opacity: 0.5, marginBottom: 6, display: 'block' }}>ID (технический, e.g. frontend_dev)</label>
                            <input
                                className="input-field"
                                value={newVacId}
                                onChange={e => setNewVacId(e.target.value)}
                                disabled={!!editingVacancy}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 13, opacity: 0.5, marginBottom: 6, display: 'block' }}>Заголовок (публичный)</label>
                            <input className="input-field" value={newVacTitle} onChange={e => setNewVacTitle(e.target.value)} />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ fontSize: 13, opacity: 0.5, marginBottom: 6, display: 'block' }}>Теги (через запятую)</label>
                            <input className="input-field" value={newVacTags} onChange={e => setNewVacTags(e.target.value)} placeholder="python, sql, fastapi..." />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={saveVacancy}>Сохранить</button>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setVacancyModalOpen(false)}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


/* ── Small reusable component for info rows in the modal ── */
function InfoRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
    return (
        <div style={{
            padding: 14, borderRadius: 12,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.04)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ opacity: 0.4 }}>{icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {label}
                </span>
            </div>
            <div style={{
                fontSize: 15, fontWeight: 600,
                color: highlight ? 'var(--accent-orange)' : 'inherit',
            }}>
                {value}
            </div>
        </div>
    )
}
