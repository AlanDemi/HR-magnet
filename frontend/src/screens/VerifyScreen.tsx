import { useState } from 'react'

type ParsedData = {
    full_name: string
    phone: string
    email: string
    skills: string[]
    experience_years: number
    summary: string
    resume_filename: string
}

type Props = {
    data: ParsedData
    onConfirm: (data: ParsedData) => void
    onBack: () => void
}

const AVAILABLE_SKILLS = [
    'Python', 'JavaScript', 'React', 'Django', 'FastAPI',
    'SQL', 'Docker', 'CSS', 'Figma', 'Redux',
    'Photoshop', 'UX', 'UI', 'Node.js', 'Git',
    'TypeScript', 'Java', 'C++', 'Machine Learning', 'Data Analysis',
    'PostgreSQL', 'Redis', 'Kubernetes', 'AWS', 'Linux',
    'Vue', 'Angular', 'Flask', 'MongoDB', 'CI/CD',
]

export default function VerifyScreen({ data, onConfirm, onBack }: Props) {
    const [fullName, setFullName] = useState(data.full_name)
    const [phone, setPhone] = useState(data.phone)
    const [email, setEmail] = useState(data.email)
    const [skills, setSkills] = useState<string[]>(data.skills)
    const [experienceYears, setExperienceYears] = useState(data.experience_years)
    const [summary, setSummary] = useState(data.summary)
    const [customSkill, setCustomSkill] = useState('')

    const toggleSkill = (skill: string) => {
        setSkills(prev =>
            prev.map(s => s.toLowerCase()).includes(skill.toLowerCase())
                ? prev.filter(s => s.toLowerCase() !== skill.toLowerCase())
                : [...prev, skill]
        )
    }

    const addCustomSkill = () => {
        const trimmed = customSkill.trim()
        if (trimmed && !skills.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) {
            setSkills(prev => [...prev, trimmed])
            setCustomSkill('')
        }
    }

    const removeSkill = (skill: string) => {
        setSkills(prev => prev.filter(s => s !== skill))
    }

    const handleConfirm = () => {
        onConfirm({
            full_name: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            skills,
            experience_years: experienceYears,
            summary: summary.trim(),
            resume_filename: data.resume_filename,
        })
    }

    const isValid = fullName.trim().length >= 2 && skills.length >= 1

    return (
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="animate-fade-in-up">

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }} className="animate-float">✅</div>
                <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, color: 'var(--accent-orange)' }}>
                    Проверьте данные
                </h1>
                <p style={{ fontSize: 13, opacity: 0.5 }}>
                    ИИ извлёк эти данные из вашего резюме. Пожалуйста, проверьте и исправьте при необходимости.
                </p>
            </div>

            {/* Main form card */}
            <div className="glass" style={{ width: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Full Name */}
                <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--accent-orange)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        👤 ФИО
                    </label>
                    <input
                        type="text"
                        className="input-field"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Иван Иванов"
                    />
                </div>

                {/* Email */}
                <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--accent-orange)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📧 Email
                    </label>
                    <input
                        type="email"
                        className="input-field"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ivan@example.com"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--accent-orange)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📱 Телефон
                    </label>
                    <input
                        type="tel"
                        className="input-field"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                    />
                </div>

                {/* Experience */}
                <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--accent-orange)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📅 Опыт (лет)
                    </label>
                    <input
                        type="number"
                        className="input-field"
                        min={0}
                        max={50}
                        value={experienceYears}
                        onChange={e => setExperienceYears(parseInt(e.target.value) || 0)}
                    />
                </div>

                {/* Skills — current */}
                <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--accent-orange)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🔧 Навыки из резюме ({skills.length})
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {skills.map(skill => (
                            <span
                                key={skill}
                                className="skill-chip selected"
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                onClick={() => removeSkill(skill)}
                            >
                                {skill}
                                <span style={{ fontSize: 14, opacity: 0.6 }}>×</span>
                            </span>
                        ))}
                        {skills.length === 0 && (
                            <span style={{ fontSize: 12, opacity: 0.4, fontStyle: 'italic' }}>
                                Навыки не найдены — добавьте вручную ↓
                            </span>
                        )}
                    </div>

                    {/* Add custom skill */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Добавить навык..."
                            value={customSkill}
                            onChange={e => setCustomSkill(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addCustomSkill()}
                            style={{ flex: 1 }}
                        />
                        <button
                            className="btn-primary"
                            style={{ padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap' }}
                            onClick={addCustomSkill}
                            disabled={!customSkill.trim()}
                        >
                            + Добавить
                        </button>
                    </div>

                    {/* Quick-add from predefined list */}
                    <div style={{ maxHeight: 120, overflowY: 'auto', paddingRight: 4 }} className="custom-scrollbar">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {AVAILABLE_SKILLS.filter(s => !skills.map(sk => sk.toLowerCase()).includes(s.toLowerCase())).map(skill => (
                                <button
                                    key={skill}
                                    className="skill-chip"
                                    style={{ fontSize: 11, padding: '4px 10px' }}
                                    onClick={() => toggleSkill(skill)}
                                >
                                    + {skill}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--accent-orange)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        📝 О себе
                    </label>
                    <textarea
                        className="input-field"
                        rows={3}
                        style={{ resize: 'none' }}
                        value={summary}
                        onChange={e => setSummary(e.target.value)}
                        placeholder="Краткое описание опыта..."
                    />
                </div>
            </div>

            {/* Action buttons */}
            <div style={{ width: '100%', display: 'flex', gap: 14, marginTop: 24 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={onBack}>
                    ← Назад
                </button>
                <button
                    className="btn-primary"
                    style={{
                        flex: 1,
                        background: 'var(--accent-orange)',
                        boxShadow: isValid ? '0 10px 25px -5px rgba(254, 131, 12, 0.4)' : 'none',
                    }}
                    onClick={handleConfirm}
                    disabled={!isValid}
                >
                    🚀 Найти вакансии
                </button>
            </div>
        </div>
    )
}
