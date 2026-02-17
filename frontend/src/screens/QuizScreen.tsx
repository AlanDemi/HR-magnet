import { useState } from 'react'

type Props = {
    onComplete: () => void
}

type Question = {
    text: string
    options: string[]
    correct: number
}

const QUESTIONS: Question[] = [
    {
        text: '🐍 Какой язык программирования известен своей читаемостью и значимыми отступами?',
        options: ['Java', 'Python', 'C++', 'Rust'],
        correct: 1,
    },
    {
        text: '⚛️ Какая библиотека была создана Facebook для построения интерфейсов?',
        options: ['Vue', 'Angular', 'React', 'Svelte'],
        correct: 2,
    },
    {
        text: '🐳 Для чего в основном используется Docker?',
        options: ['Базы данных', 'Контейнеризация', 'Дизайн', 'Роутинг'],
        correct: 1,
    },
]

export default function QuizScreen({ onComplete }: Props) {
    const [current, setCurrent] = useState(0)
    const [score, setScore] = useState(0)
    const [selected, setSelected] = useState<number | null>(null)
    const [showResult, setShowResult] = useState(false)
    const [finished, setFinished] = useState(false)

    const q = QUESTIONS[current]

    const handleAnswer = (idx: number) => {
        if (selected !== null) return
        setSelected(idx)
        setShowResult(true)

        if (idx === q.correct) {
            setScore(s => s + 1)
        }

        setTimeout(() => {
            if (current < QUESTIONS.length - 1) {
                setCurrent(c => c + 1)
                setSelected(null)
                setShowResult(false)
            } else {
                setFinished(true)
            }
        }, 600)
    }

    if (finished) {
        return (
            <div style={{ width: '100%', maxWidth: 448, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} className="animate-fade-in-up">
                <div style={{ fontSize: 64, marginBottom: 16 }}>
                    {score === QUESTIONS.length ? '🏆' : score >= 2 ? '🎉' : '😊'}
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Викторина окончена!</h2>
                <p style={{ fontSize: 18, marginBottom: 8, color: 'var(--accent-light)' }}>
                    Ваш результат: <span style={{ fontWeight: 700, color: '#fff' }}>{score}/{QUESTIONS.length}</span>
                </p>
                <p style={{ fontSize: 14, marginBottom: 32, color: 'var(--tg-theme-hint-color)' }}>
                    {score === QUESTIONS.length
                        ? "Великолепно! Вы определенно готовы к нам присоединиться!"
                        : score >= 2
                            ? 'Отлично! Заходите к нам на стенд за подарками!'
                            : 'Хорошая попытка! Узнайте больше у нас на стендах 🎓'}
                </p>
                <button className="btn-primary" onClick={onComplete} style={{ maxWidth: 320 }}>
                    🎫 Получить билет →
                </button>
            </div>
        )
    }

    return (
        <div style={{ width: '100%', maxWidth: 448, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="animate-fade-in-up">

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🎮</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Бонус-тест!</h2>
                <p style={{ fontSize: 13, color: 'var(--tg-theme-hint-color)' }}>
                    Ответьте на вопросы и получите приз на стенде
                </p>
            </div>

            {/* Progress */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tg-theme-hint-color)' }}>
                    {current + 1}/{QUESTIONS.length}
                </span>
                <div className="progress-bar" style={{ flex: 1 }}>
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${((current + 1) / QUESTIONS.length) * 100}%` }}
                    />
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--success)' }}>
                    {score} pts
                </span>
            </div>

            {/* Question card */}
            <div className="glass" style={{ width: '100%', padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: 17, fontWeight: 600 }}>{q.text}</h3>
            </div>

            {/* Options */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.options.map((opt, idx) => {
                    let style: React.CSSProperties = {}
                    if (showResult) {
                        if (idx === q.correct) {
                            style = { border: '1px solid #00cec9', background: 'rgba(0, 206, 201, 0.15)' }
                        } else if (idx === selected && idx !== q.correct) {
                            style = { border: '1px solid #d63031', background: 'rgba(214, 48, 49, 0.15)' }
                        }
                    }

                    return (
                        <button
                            key={idx}
                            className="glass"
                            style={{ padding: 16, textAlign: 'left', fontWeight: 500, cursor: 'pointer', transition: 'transform 0.1s', ...style }}
                            onClick={() => handleAnswer(idx)}
                            onMouseEnter={e => { if (!showResult) e.currentTarget.style.transform = 'scale(1.01)' }}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <span style={{ marginRight: 8, color: 'var(--tg-theme-hint-color)' }}>
                                {String.fromCharCode(65 + idx)}.
                            </span>
                            {opt}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
