import React, { useEffect, useRef, useState, useMemo } from 'react'
import type { MatchedJob } from '../types'
import { Download, Share2, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

type Props = {
    name: string
    job: MatchedJob | null
    onRestart: () => void
}

export default function TicketScreen({ name, job, onRestart }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [saved, setSaved] = useState(false)

    // Generate stable ID that doesn't change on re-render
    const ticketId = useMemo(() =>
        `US-${Math.random().toString(36).toUpperCase().slice(-6)}`,
        [])

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

        // Background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)

        // QR Pattern (Mock)
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

        // Logo Center
        ctx.fillStyle = '#FE830C'
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, 18, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 18px Onest, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('US', size / 2, size / 2)
    }

    const handleSave = () => {
        // Mock save functionality
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="w-full max-w-md animate-fade-in-up flex flex-col items-center">

            {/* Success Message Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-400 mb-4 animate-bounce">
                    <CheckCircle size={32} />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">Заявка принята!</h1>
                <p className="text-sm text-gray-400">Сохраните этот билет для входа</p>
            </div>

            {/* Ticket Card */}
            <motion.div
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 20 }}
                className="w-full bg-[#0c121d] rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative"
            >
                {/* Decorative Top Gradient */}
                <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />

                {/* Header Section */}
                <div className="p-6 pb-0 text-center relative z-10">
                    <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">
                        Job Fair 2026 Pass
                    </div>
                    <div className="text-4xl font-black text-white tracking-tighter mb-1">
                        UZINFOCOM
                    </div>
                    <div className="text-xs font-bold text-blue-400 tracking-[0.2em] uppercase">
                        Career Entrance
                    </div>
                </div>

                {/* QR Section */}
                <div className="relative py-8 flex justify-center">
                    {/* Side Cutouts */}
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#04070d]" />
                    <div className="absolute right-0 top-1/2 translate-x-1/2 w-8 h-8 rounded-full bg-[#04070d]" />

                    {/* Dashed Line */}
                    <div className="absolute left-6 right-6 top-1/2 border-t-2 border-dashed border-gray-800 -z-0" />

                    {/* QR Container */}
                    <div className="relative z-10 p-2 bg-white rounded-xl shadow-[0_0_40px_rgba(255,165,0,0.2)]">
                        <canvas
                            ref={canvasRef}
                            className="w-48 h-48 rounded-lg"
                        />
                    </div>
                </div>

                {/* Info Section */}
                <div className="px-8 pb-8 pt-2 space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                        <div className="text-left">
                            <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Кандидат</div>
                            <div className="text-lg font-bold text-white max-w-[140px] truncate">{name || 'Гость'}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">ID Билета</div>
                            <div className="font-mono text-lg text-orange-400">{ticketId}</div>
                        </div>
                    </div>

                    <div className="text-[9px] text-center text-gray-500 uppercase tracking-tight leading-tight px-4 font-medium italic opacity-70">
                        Этот ID и QR-код используются рекрутерами UZINFOCOM для мгновенного поиска вашего резюме на стенде
                    </div>

                    {job && (
                        <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/5">
                            <div>
                                <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Выбранная вакансия</div>
                                <div className="text-sm font-bold text-white">{job.title}</div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                                {job.match_pct}%
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none" />
            </motion.div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full mt-6">
                <button
                    onClick={handleSave}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 group relative overflow-hidden"
                >
                    {saved ? (
                        <span className="flex items-center gap-2 animate-pulse">
                            <CheckCircle size={18} /> Сохранено
                        </span>
                    ) : (
                        <>
                            <Download size={18} /> Скачать билет
                        </>
                    )}
                </button>
                <div className="w-px bg-white/10" />
                <button
                    onClick={onRestart}
                    className="btn-secondary w-14 flex items-center justify-center"
                    aria-label="Начать заново"
                >
                    🔄
                </button>
            </div>

            <p className="mt-6 text-[10px] text-gray-600 font-bold uppercase tracking-widest opacity-50">
                Покажите этот экран рекрутеру у стенда
            </p>
        </div>
    )
}
