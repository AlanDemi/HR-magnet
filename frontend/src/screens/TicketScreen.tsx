import { useEffect, useRef } from 'react'
import type { MatchedJob } from '../types'

type Props = {
    name: string
    job: MatchedJob | null
    onRestart: () => void
}

export default function TicketScreen({ name, job, onRestart }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        drawQR()
    }, [name, job])

    const drawQR = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const size = 200
        canvas.width = size
        canvas.height = size

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)

        ctx.fillStyle = '#0f0f1a'
        const cellSize = 10
        const grid = size / cellSize

        let seed = 0
        for (let i = 0; i < name.length; i++) seed += name.charCodeAt(i)

        const drawMarker = (x: number, y: number) => {
            ctx.fillRect(x, y, 70, 70)
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(x + 10, y + 10, 50, 50)
            ctx.fillStyle = '#0f0f1a'
            ctx.fillRect(x + 20, y + 20, 30, 30)
        }

        drawMarker(0, 0)
        ctx.fillStyle = '#0f0f1a'
        drawMarker(size - 70, 0)
        ctx.fillStyle = '#0f0f1a'
        drawMarker(0, size - 70)

        for (let y = 8; y < grid - 2; y++) {
            for (let x = 8; x < grid - 2; x++) {
                seed = (seed * 1103515245 + 12345) & 0x7fffffff
                if (seed % 3 === 0) {
                    ctx.fillStyle = '#0f0f1a'
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
                }
            }
        }

        ctx.fillStyle = '#FE830C'
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, 18, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 18px Onest, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('HM', size / 2, size / 2)
    }

    const ticketId = `HR-${Date.now().toString(36).toUpperCase().slice(-6)}`

    return (
        <div style={{ width: '100%', maxWidth: 448, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} className="animate-fade-in-up">

            {/* Ticket card */}
            <div className="glass" style={{ width: '100%', overflow: 'hidden' }}>

                {/* Top banner */}
                <div style={{ padding: '24px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-orange))' }}>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>🎫 ВАШ ВХОДНОЙ БИЛЕТ</h2>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>Покажите этот QR-код на нашем стенде</p>
                </div>

                {/* Content */}
                <div style={{ padding: 32 }}>
                    {/* QR Code */}
                    <div style={{
                        display: 'inline-block', padding: 16, borderRadius: 20, marginBottom: 24,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                        <canvas
                            ref={canvasRef}
                            style={{ width: 180, height: 180, borderRadius: 12, display: 'block' }}
                        />
                    </div>

                    {/* Info */}
                    <div style={{ textAlign: 'left', marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--glass-border)' }}>
                            <span style={{ fontSize: 13, opacity: 0.5 }}>Кандидат</span>
                            <span style={{ fontWeight: 700, fontSize: 17 }}>{name || 'Гость'}</span>
                        </div>
                        {job && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--glass-border)' }}>
                                <span style={{ fontSize: 13, opacity: 0.5 }}>Должность</span>
                                <span style={{ fontWeight: 700, color: '#FE830C', textAlign: 'right' }}>{job.title}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
                            <span style={{ fontSize: 13, opacity: 0.5 }}>ID Билета</span>
                            <span style={{ fontFamily: 'monospace', fontSize: 13, padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6, color: 'var(--accent-orange)' }}>
                                {ticketId}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom dashed line */}
                <div style={{ padding: '0 32px' }}>
                    <div style={{ borderTop: '1px dashed var(--glass-border)' }} />
                </div>

                {/* Footer */}
                <div style={{ padding: 24 }}>
                    <p style={{ fontSize: 11, fontWeight: 500, opacity: 0.35, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        🚀 HR-Magnet Networking Tool
                    </p>
                </div>
            </div>

            {/* Restart */}
            <button className="btn-secondary" style={{ marginTop: 24, width: '100%' }} onClick={onRestart}>
                🔄 Начать заново
            </button>
        </div>
    )
}
