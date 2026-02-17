import { useState } from 'react'
import type { ProfileData } from '../types'

const AVAILABLE_SKILLS = [
    'Python', 'JavaScript', 'React', 'Django', 'FastAPI',
    'SQL', 'Docker', 'CSS', 'Figma', 'Redux',
    'Photoshop', 'UX', 'UI', 'Node.js', 'Git',
    'TypeScript', 'Java', 'C++', 'Machine Learning', 'Data Analysis',
]

type Props = {
    onComplete: (data: ProfileData) => void
    onFileUpload: (file: File) => void
}

export default function WizardScreen({ onComplete, onFileUpload }: Props) {
    const [step, setStep] = useState(-1) // -1 is Welcome
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [skills, setSkills] = useState<string[]>([])
    const [about, setAbout] = useState('')
    const [isUploading, setIsUploading] = useState(false)

    const steps = ['Приветствие', 'Имя', 'Email', 'Телефон', 'Навыки', 'О себе']
    const progress = Math.max(0, (step / (steps.length - 2)) * 100)

    const toggleSkill = (skill: string) => {
        setSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        )
    }

    const canProceed = () => {
        if (step === 0) return name.trim().length >= 2
        if (step === 1) return email.trim().length >= 5 && email.includes('@')
        if (step === 2) return phone.trim().length >= 7
        if (step === 3) return skills.length >= 1
        return true
    }

    const handleNext = () => {
        if (step < 4) {
            setStep(step + 1)
        } else {
            onComplete({
                full_name: name.trim(),
                phone: phone.trim(),
                email: email.trim(),
                skills,
                about: about.trim()
            })
        }
    }

    const handleBack = () => {
        if (step > -1) setStep(step - 1)
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        // Pass the file to App.tsx which sends it to /api/parse-resume
        onFileUpload(file)
    }

    return (
        <div style={{ width: '100%', maxWidth: 448, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="animate-fade-in-up">

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 64, marginBottom: 12 }} className="animate-float">🧲</div>
                <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 6, letterSpacing: '-0.02em', color: 'var(--accent-orange)' }}>HR-Magnet</h1>
                <p style={{ fontSize: 14, fontWeight: 500, opacity: 0.5 }}>
                    {step === -1 ? 'Найди работу мечты за 1 минуту' : `Шаг ${step + 1} из ${steps.length - 1}`}
                </p>
            </div>

            {/* Progress bar (only for manual steps) */}
            {step >= 0 && (
                <div className="progress-bar" style={{ width: '100%', marginBottom: 24 }}>
                    <div className="progress-bar-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-orange))' }} />
                </div>
            )}

            {/* Content card */}
            <div className="glass" style={{ width: '100%', padding: 28 }}>

                {/* Step -1: Welcome */}
                {step === -1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ textAlign: 'center', marginBottom: 8 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Добро пожаловать!</h2>
                            <p style={{ fontSize: 14, opacity: 0.5 }}>Как вы хотите предоставить информацию?</p>
                        </div>

                        <label className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', background: 'var(--accent-blue)' }}>
                            📂 Загрузить резюме / Фото
                            <input type="file" hidden accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={handleFileUpload} disabled={isUploading} />
                        </label>

                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                            <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                            <span style={{ position: 'relative', padding: '0 16px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.25, background: 'var(--surface-card)' }}>ИЛИ</span>
                        </div>

                        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }} onClick={() => setStep(0)}>
                            ✍️ Заполнить анкету вручную
                        </button>

                        <p style={{ fontSize: 10, textAlign: 'center', opacity: 0.35, marginTop: 8, lineHeight: 1.6 }}>
                            Поддерживаемые форматы:<br />PDF, DOCX, JPG, PNG
                        </p>
                    </div>
                )}

                {/* Step 0: Name */}
                {step === 0 && (
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FE830C', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            👤 Как вас зовут?
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Иван Иванов"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && canProceed() && handleNext()}
                        />
                    </div>
                )}

                {/* Step 1: Email */}
                {step === 1 && (
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FE830C', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            📧 Адрес эл. почты
                        </label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="ivan@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && canProceed() && handleNext()}
                        />
                    </div>
                )}

                {/* Step 2: Phone */}
                {step === 2 && (
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FE830C', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            📱 Номер телефона
                        </label>
                        <input
                            type="tel"
                            className="input-field"
                            placeholder="+998 90 123 45 67"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && canProceed() && handleNext()}
                        />
                    </div>
                )}

                {/* Step 3: Skills */}
                {step === 3 && (
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FE830C', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            🔧 Навыки ({skills.length})
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }} className="custom-scrollbar">
                            {AVAILABLE_SKILLS.map(skill => (
                                <button
                                    key={skill}
                                    className={`skill-chip ${skills.includes(skill) ? 'selected' : ''}`}
                                    onClick={() => toggleSkill(skill)}
                                >
                                    {skill}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 4: About */}
                {step === 4 && (
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FE830C', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            📝 О себе (необязательно)
                        </label>
                        <textarea
                            className="input-field"
                            rows={5}
                            style={{ resize: 'none' }}
                            placeholder="Расскажите о своем опыте..."
                            value={about}
                            onChange={e => setAbout(e.target.value)}
                            autoFocus
                        />
                    </div>
                )}
            </div>

            {/* Navigation buttons */}
            {step >= 0 && (
                <div style={{ width: '100%', display: 'flex', gap: 14, marginTop: 24 }}>
                    <button className="btn-secondary" style={{ flex: 1 }} onClick={handleBack}>
                        ← Назад
                    </button>
                    <button
                        className="btn-primary"
                        style={{
                            flex: 1,
                            background: step === 4 ? 'var(--accent-orange)' : 'var(--accent-blue)',
                            boxShadow: canProceed() ? `0 10px 25px -5px ${step === 4 ? 'rgba(254, 131, 12, 0.4)' : 'rgba(76, 81, 198, 0.4)'}` : 'none',
                        }}
                        onClick={handleNext}
                        disabled={!canProceed()}
                    >
                        {step < 4 ? 'Далее →' : '🚀 Отправить'}
                    </button>
                </div>
            )}
        </div>
    )
}
