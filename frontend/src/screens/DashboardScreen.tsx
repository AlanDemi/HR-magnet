import { FileText, UserPlus, HelpCircle, Briefcase, ChevronRight, Award } from 'lucide-react'
import { motion } from 'framer-motion'

type Props = {
    onStartManual: () => void
    onStartResume: (file: File) => void
    onViewFAQ: () => void
    onViewAllJobs: () => void
}

export default function DashboardScreen({ onStartManual, onStartResume, onViewFAQ, onViewAllJobs }: Props) {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) onStartResume(file)
    }

    return (
        <div className="w-full max-w-md animate-fade-in-up select-none">
            {/* Promo Header */}
            <div className="text-center mb-10">
                <div className="inline-block p-3 rounded-2xl bg-gradient-to-br from-orange-400/20 to-blue-400/20 mb-4 animate-float">
                    <Award size={40} className="text-orange-400" />
                </div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    UStart
                </h1>
                <p className="text-sm font-medium text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                    Твой персональный пропуск в мир карьеры на Job Fair 2026
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* Main Action: Upload Resume */}
                <label className="relative group overflow-hidden glass p-6 block cursor-pointer active:scale-[0.98] hover:scale-[1.02] transition-all duration-300 hover:bg-blue-500/10 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] border border-white/5 transform-gpu">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <FileText size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                                <FileText size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Smart Match</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Загрузить резюме</h3>
                        <p className="text-xs text-gray-400 font-medium">ИИ сам заполнит профиль за 10 секунд</p>
                    </div>
                    <input type="file" hidden accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={handleFileUpload} />
                </label>

                {/* Manual Entry */}
                <button
                    onClick={onStartManual}
                    className="relative group glass p-5 flex items-center justify-between active:scale-[0.98] hover:scale-[1.02] transition-all duration-300 hover:bg-orange-500/10 hover:border-orange-500/30 hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] outline-none focus:outline-none overflow-hidden transform-gpu border border-white/5"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                            <UserPlus size={20} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-bold text-white">Заполнить вручную</h3>
                            <p className="text-[10px] text-gray-500 font-medium">Для тех, у кого нет файла под рукой</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-colors" />
                </button>

                <div className="grid grid-cols-2 gap-4">
                    {/* Browse Jobs */}
                    <button
                        onClick={onViewAllJobs}
                        className="relative glass p-5 flex flex-col gap-3 active:scale-[0.98] hover:scale-[1.05] transition-all duration-300 hover:bg-purple-500/10 hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] text-left outline-none focus:outline-none overflow-hidden transform-gpu border border-white/5"
                    >
                        <div className="p-2 w-fit rounded-xl bg-purple-500/20 text-purple-400">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Наши вакансии</h3>
                            <p className="text-[10px] text-gray-500 font-medium line-clamp-1">Актуальные позиции UStart</p>
                        </div>
                    </button>

                    {/* FAQ */}
                    <button
                        onClick={onViewFAQ}
                        className="relative glass p-5 flex flex-col gap-3 active:scale-[0.98] hover:scale-[1.05] transition-all duration-300 hover:bg-green-500/10 hover:border-green-500/30 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)] text-left outline-none focus:outline-none overflow-hidden transform-gpu border border-white/5"
                    >
                        <div className="p-2 w-fit rounded-xl bg-green-500/20 text-green-400">
                            <HelpCircle size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Помощь</h3>
                            <p className="text-[10px] text-gray-500 font-medium line-clamp-1">Ответы на вопросы</p>
                        </div>
                    </button>
                </div>
            </div>

            <div className="mt-12 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-2">Powered by</p>
                <div className="text-sm font-black tracking-tighter text-white opacity-40">UZINFOCOM / AI Labs</div>
            </div>
        </div>
    )
}
