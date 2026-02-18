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
    onBack?: () => void
}

export default function WizardScreen({ onComplete, onFileUpload, onBack }: Props) {
    const [step, setStep] = useState(0) // Start directly at Name input
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('+998 ')
    const [email, setEmail] = useState('')
    const [skills, setSkills] = useState<string[]>([])
    const [manualSkill, setManualSkill] = useState('')
    const [experience, setExperience] = useState('0')
    const [about, setAbout] = useState('')
    const [isUploading, setIsUploading] = useState(false)

    const skillMap: { [key: string]: string } = {
        'питон': 'Python',
        'джаваскрипт': 'JavaScript',
        'реакт': 'React',
        'джанго': 'Django',
        'фаст апи': 'FastAPI',
        'доккер': 'Docker',
        'фигма': 'Figma',
        'редис': 'Redis',
        'нода': 'Node.js',
        'тайпскрипт': 'TypeScript',
    }

    const steps = ['Имя', 'Email', 'Телефон', 'Навыки', 'О себе']
    const progress = Math.max(0, (step / (steps.length - 1)) * 100)

    const toggleSkill = (skill: string) => {
        setSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        )
    }

    const isGibberish = (text: string) => {
        if (!text) return false
        const s = text.trim()
        if (s.length < 2) return true

        // 1. Repeating characters (aaaaa, 11111)
        if (/(.)\1{4,}/.test(s.toLowerCase())) return true

        // 2. Large blocks of digits in what should be a name
        if ((s.match(/\d/g) || []).length > s.length * 0.4) return true

        // 3. No vowels (detects sghjk, fdfdfd - works for both Latin and Cyrillic)
        // Names usually have at least one vowel every few characters
        const hasVowels = /[aeiouyаеёиоуыэюя]/i.test(s)
        if (s.length > 5 && !hasVowels) return true

        // 4. Unique character diversity
        const uniqueChars = new Set(s.toLowerCase().replace(/\s/g, '')).size
        if (s.length > 8 && uniqueChars < 4) return true

        // 5. Random alphanumeric strings (e.g. fjdi9gjold)
        // Check for lack of spaces in long strings which are usually names
        if (s.length > 15 && !s.includes(' ')) return true

        return false
    }

    const formatPhone = (val: string) => {
        let cleaned = val.replace(/\D/g, '')
        if (!cleaned.startsWith('998')) cleaned = '998' + cleaned
        cleaned = cleaned.substring(0, 12)

        let result = '+'
        for (let i = 0; i < cleaned.length; i++) {
            if (i === 3 || i === 5 || i === 8 || i === 10) result += ' '
            result += cleaned[i]
        }
        return result.trim()
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value)
        setPhone(formatted)
    }

    const addManualSkill = () => {
        const s = manualSkill.trim().toLowerCase()
        if (!s) return
        const normalized = skillMap[s] || manualSkill.trim()
        if (!skills.includes(normalized)) {
            setSkills([...skills, normalized])
        }
        setManualSkill('')
    }

    const canProceed = () => {
        if (step === 0) return name.trim().length >= 2 && !isGibberish(name)
        if (step === 1) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        if (step === 2) return phone.replace(/\s/g, '').length === 13
        if (step === 3) return true // Experience is optional or has default '0'
        if (step === 4) return skills.length >= 1
        return true
    }

    const handleNext = () => {
        if (step < 5) {
            setStep(step + 1)
        } else {
            onComplete({
                full_name: name.trim(),
                phone: phone.trim(),
                email: email.trim(),
                skills,
                experience_years: parseInt(experience) || 0,
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
        <div className="w-full max-w-md flex flex-col items-center animate-fade-in-up select-none">

            {/* Header */}
            <div className="text-center mb-8">
                <div className="text-6xl mb-3 animate-float">🧲</div>
                <h1 className="text-3xl font-black mb-1.5 tracking-tighter text-orange-500">UStart</h1>
                <p style={{ fontSize: 14, fontWeight: 500, opacity: 0.5 }}>
                    Шаг {step + 1} из {steps.length}
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
                            onChange={handlePhoneChange}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && canProceed() && handleNext()}
                        />
                    </div>
                )}

                {/* Step 3: Experience */}
                {step === 3 && (
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FE830C', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            📅 Опыт работы (лет)
                        </label>
                        <input
                            type="number"
                            className="input-field"
                            min="0"
                            max="50"
                            value={experience}
                            onChange={e => setExperience(e.target.value)}
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && canProceed() && handleNext()}
                        />
                        <p style={{ fontSize: 11, opacity: 0.5, marginTop: 10 }}>
                            Укажите примерное количество полных лет опыта
                        </p>
                    </div>
                )}

                {/* Step 4: Skills */}
                {step === 4 && (
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FE830C', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            🔧 Выберите навыки ({skills.length})
                        </label>

                        {/* Selected Skills Preview */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, minHeight: 32 }}>
                            {skills.map(s => (
                                <span key={s} className="tag-badge-blue animate-fade-in" style={{ cursor: 'pointer' }} onClick={() => toggleSkill(s)}>
                                    {s} ×
                                </span>
                            ))}
                        </div>

                        {/* Manual entry */}
                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                className="input-field"
                                style={{ padding: '0.6rem 1rem' }}
                                placeholder="Свой навык (напр. Python)"
                                value={manualSkill}
                                onChange={e => setManualSkill(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addManualSkill())}
                            />
                            <button className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }} onClick={addManualSkill}>+</button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }} className="custom-scrollbar">
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

                {/* Step 5: About */}
                {step === 5 && (
                    <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#FE830C', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            📝 О себе (необязательно)
                        </label>
                        <textarea
                            className="input-field"
                            rows={5}
                            style={{ resize: 'none' }}
                            placeholder="Расскажите о своем опыте, проектах или достижениях..."
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
                            background: step === 5 ? 'var(--accent-orange)' : 'var(--accent-blue)',
                            boxShadow: canProceed() ? `0 10px 25px -5px ${step === 5 ? 'rgba(254, 131, 12, 0.4)' : 'rgba(76, 81, 198, 0.4)'}` : 'none',
                        }}
                        onClick={handleNext}
                        disabled={!canProceed()}
                    >
                        {step < 5 ? 'Далее →' : '🚀 Отправить'}
                    </button>
                </div>
            )}
        </div>
    )
}
