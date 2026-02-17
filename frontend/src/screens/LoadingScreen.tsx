import { useState, useEffect } from 'react'
import { Brain } from 'lucide-react'

type Props = {
    name: string
}

const STATUSES = [
    "Читаю ваше резюме...",
    "Uzinfocom — лидер IT-индустрии в Узбекистане",
    "ИИ анализирует ваши навыки...",
    "Знаете ли вы? Мы создали портал My.gov.uz",
    "Сверяем ваш опыт с вакансиями...",
    "Uzinfocom управляет доменом .UZ уже много лет",
    "Подбираем лучшие предложения для вас...",
    "Почти готово! Резюме без фото обрабатываются быстрее.",
    "Финальная сверка данных..."
]

export default function LoadingScreen({ name }: Props) {
    const [statusIdx, setStatusIdx] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setStatusIdx(prev => (prev + 1) % STATUSES.length)
        }, 1200)
        return () => clearInterval(interval)
    }, [])

    return (
        <div style={{ width: '100%', maxWidth: 448, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} className="animate-fade-in-up">

            {/* Spinning AI brain container */}
            <div style={{ position: 'relative', width: 128, height: 128, marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Outer pulsing ring */}
                <div
                    className="animate-pulse-glow"
                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', opacity: 0.5, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-orange))' }}
                />
                {/* Inner rotating ring */}
                <div
                    className="animate-spin-slow"
                    style={{ position: 'absolute', inset: 8, borderRadius: '50%', borderTop: '2px solid var(--accent-orange)', borderRight: '2px solid var(--accent-blue)', borderBottom: '2px solid transparent', borderLeft: '2px solid transparent' }}
                />
                {/* Icon Core */}
                <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-card)', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                    <Brain size={42} color="#fff" className="animate-pulse" />
                </div>
            </div>

            {/* Status text block */}
            <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, letterSpacing: '-0.02em' }}>
                    {name ? `${name.split(' ')[0]}, мы работаем!` : 'Обработка данных...'}
                </h2>
                <div style={{ display: 'inline-block', padding: '6px 20px', borderRadius: 20, border: '1px solid rgba(254, 131, 12, 0.2)', background: 'rgba(254, 131, 12, 0.1)' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FE830C' }}>
                        {STATUSES[statusIdx]}
                    </p>
                </div>
            </div>

            {/* Animated dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="animate-bounce"
                        style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: i === 0 ? 'var(--accent-blue)' : i === 1 ? 'var(--accent-orange)' : 'white',
                            animationDelay: `${i * 0.15}s`,
                            boxShadow: `0 0 10px ${i === 0 ? 'rgba(76,81,198,0.5)' : i === 1 ? 'rgba(254,131,12,0.5)' : 'rgba(255,255,255,0.3)'}`,
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
