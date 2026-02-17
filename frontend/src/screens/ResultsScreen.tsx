import type { MatchedJob } from '../types'

type Props = {
    jobs: MatchedJob[]
    onApply: (job: MatchedJob) => void
}

function getMatchColor(pct: number): string {
    if (pct >= 60) return '#FE830C'
    if (pct >= 30) return '#4C51C6'
    return '#636e72'
}

function getMatchLabel(pct: number): string {
    if (pct >= 60) return '🔥 Идеальное совпадение!'
    if (pct >= 30) return '👍 Отличный вариант'
    return '🤔 Стоит заглянуть'
}

export default function ResultsScreen({ jobs, onApply }: Props) {
    const topJobs = jobs.filter(j => j.match_pct > 0)
    const otherJobs = jobs.filter(j => j.match_pct === 0)

    return (
        <div style={{ width: '100%', maxWidth: 448, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="animate-fade-in-up">

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 52, marginBottom: 12 }} className="animate-float">🚀</div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: 'var(--accent-orange)' }}>
                    {topJobs.length > 0
                        ? `Найдено ${topJobs.length} совпадений!`
                        : 'Наши вакансии'}
                </h1>
                <p style={{ fontSize: 13, opacity: 0.5 }}>
                    Нажмите на карточку, чтобы узнать больше и откликнуться
                </p>
            </div>

            {/* Job cards */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...topJobs, ...otherJobs].map((job, idx) => {
                    const color = getMatchColor(job.match_pct)
                    return (
                        <button
                            key={job.id}
                            className="glass"
                            style={{
                                padding: 20, textAlign: 'left', cursor: 'pointer',
                                transition: 'transform 0.15s',
                                animationDelay: `${idx * 0.1}s`,
                                borderLeft: job.match_pct >= 60 ? '4px solid var(--accent-orange)' : undefined,
                            }}
                            onClick={() => onApply(job)}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <h3 style={{ fontWeight: 600, fontSize: 16 }}>{job.title}</h3>
                                <span style={{
                                    fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                                    background: `${color}20`, color, border: `1px solid ${color}40`,
                                }}>
                                    {job.match_pct}%
                                </span>
                            </div>

                            {/* Match bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                <div className="match-bar">
                                    <div
                                        className="match-bar-fill"
                                        style={{
                                            width: `${Math.max(job.match_pct, 5)}%`,
                                            background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.1))`,
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', color }}>{getMatchLabel(job.match_pct)}</span>
                            </div>

                            {/* Matched tags */}
                            {job.matched_tags.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                    {job.matched_tags.map(tag => (
                                        <span key={tag} className="tag-badge">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
