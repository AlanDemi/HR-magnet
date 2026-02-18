import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { MatchedJob } from '../types'

type Props = {
    jobs: MatchedJob[]
    onApply: (job: MatchedJob) => void
    onRestart?: () => void
    isBrowseMode?: boolean
}

const JOBS_PER_PAGE = 3

function getMatchStyles(pct: number) {
    if (pct >= 75) return {
        color: '#ff9d42',
        gradient: 'linear-gradient(135deg, #ff9d42 0%, #ff5f42 100%)',
        label: '🔥 Идеальное совпадение!',
        badgeClass: 'tag-badge'
    }
    if (pct >= 40) return {
        color: '#5ba1ff',
        gradient: 'linear-gradient(135deg, #5ba1ff 0%, #6b72ff 100%)',
        label: '👍 Отличный вариант',
        badgeClass: 'tag-badge-blue'
    }
    return {
        color: '#94a3b8',
        gradient: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
        label: '🤔 Стоит заглянуть',
        badgeClass: 'tag-badge'
    }
}

export default function ResultsScreen({ jobs, onApply, onRestart, isBrowseMode = false }: Props) {
    const [currentPage, setCurrentPage] = useState(0)

    const sortedJobs = isBrowseMode ? jobs : [...jobs].sort((a, b) => b.match_pct - a.match_pct)
    const totalPages = Math.ceil(sortedJobs.length / JOBS_PER_PAGE)
    const paginatedJobs = sortedJobs.slice(currentPage * JOBS_PER_PAGE, (currentPage + 1) * JOBS_PER_PAGE)

    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 0, 0))

    return (
        <div style={{ width: '100%', maxWidth: 448, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="animate-fade-in-up">

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>{isBrowseMode ? '💼' : '🎯'}</div>
                <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6, background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {isBrowseMode ? 'Наши вакансии' : `Найдено ${jobs.length} вариантов`}
                </h1>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', opacity: 0.7 }}>
                    {isBrowseMode ? 'Актуальные позиции в UStart' : 'Мы подобрали вакансии под ваши навыки'}
                </p>
            </div>

            {/* Pagination Info */}
            {totalPages > 1 && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Страница {currentPage + 1} из {totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            className="nav-btn"
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="nav-btn"
                            disabled={currentPage === totalPages - 1}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Job cards */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {paginatedJobs.map((job, idx) => {
                    const styles = getMatchStyles(job.match_pct)
                    const isHighMatch = job.match_pct >= 75
                    const CardComponent = isBrowseMode ? 'div' : 'button'

                    return (
                        <CardComponent
                            key={job.id}
                            className="job-card"
                            style={{
                                width: '100%',
                                padding: '24px',
                                textAlign: 'left',
                                cursor: isBrowseMode ? 'default' : 'pointer',
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: '24px',
                                border: 'none',
                                background: 'rgba(23, 28, 41, 0.9)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                boxShadow: isBrowseMode
                                    ? 'inset 0 0 0 1px rgba(168, 85, 247, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3)'
                                    : (isHighMatch
                                        ? 'inset 0 0 0 1px rgba(255, 157, 66, 0.2), 0 8px 32px rgba(0, 0, 0, 0.4)'
                                        : 'inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 8px 32px rgba(0, 0, 0, 0.3)'),
                                outline: 'none'
                            }}
                            onClick={isBrowseMode ? undefined : () => onApply(job)}
                        >
                            {/* Decorative gradient blur */}
                            {isHighMatch && !isBrowseMode && (
                                <div style={{
                                    position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                                    background: 'var(--accent-orange)', filter: 'blur(50px)', opacity: 0.1, pointerEvents: 'none'
                                }} />
                            )}

                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h3 style={{ fontWeight: 800, fontSize: 18, flex: 1, marginRight: 12, lineHeight: 1.2 }}>{job.title}</h3>
                                {!isBrowseMode && (
                                    <div style={{
                                        fontSize: 14, fontWeight: 900, padding: '6px 14px', borderRadius: 12,
                                        background: styles.gradient, color: '#fff', boxShadow: `0 4px 12px ${styles.color}40`
                                    }}>
                                        {job.match_pct}%
                                    </div>
                                )}
                            </div>

                            {/* Match bar */}
                            {!isBrowseMode && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <div className="match-bar">
                                        <div
                                            className="match-bar-fill"
                                            style={{
                                                width: `${Math.max(job.match_pct, 5)}%`,
                                                background: styles.gradient,
                                            }}
                                        />
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: styles.color }}>{styles.label}</span>
                                </div>
                            )}

                            {/* Matched tags */}
                            {job.matched_tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {job.matched_tags.map(tag => (
                                        <span key={tag} className={styles.badgeClass}>{tag}</span>
                                    ))}
                                </div>
                            )}
                        </CardComponent>
                    )
                })}
            </div>

            {/* Page Dots */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: i === currentPage ? 24 : 8,
                                height: 8,
                                borderRadius: 4,
                                background: i === currentPage ? 'var(--accent-blue)' : 'rgba(255,255,255,0.2)',
                                transition: 'all 0.3s'
                            }}
                        />
                    ))}
                </div>
            )}

            {onRestart && (
                <button
                    onClick={onRestart}
                    className="btn-secondary w-full mt-8 flex items-center justify-center gap-2"
                >
                    <ChevronLeft size={16} /> На главную
                </button>
            )}
        </div>
    )
}
