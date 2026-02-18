import { ChevronDown, HelpCircle, MessageCircle, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const FAQS = [
    {
        question: "Как работает ИИ-подбор?",
        answer: "Наша система анализирует текст вашего резюме или анкеты, извлекает ключевые навыки и сопоставляет их с требованиями вакансий UZINFOCOM. Чем подробнее заполнена анкета, тем точнее будет совпадение."
    },
    {
        question: "Нужна ли бумажная копия резюме?",
        answer: "Нам достаточно вашего цифрового профиль в этом приложении — рекрутеры увидят отклик моментально. Однако мы рекомендуем иметь при себе пару бумажных копий для личного архива рекрутеров."
    },
    {
        question: "Я не нашел свою специальность, что делать?",
        answer: "Вы можете заполнить анкету в свободном формате, выбрав наиболее близкую категорию. Мы сохраним ваш профиль в базе талантов UZINFOCOM, и рекрутеры свяжутся с вами, когда появится подходящая позиция."
    },
    {
        question: "Где найти ваш стенд?",
        answer: "Наши рекрутеры всегда находятся на фирменном стенде UZINFOCOM и готовы ответить на любые вопросы. Ищите наш яркий сине-оранжевый брендинг!"
    },
    {
        question: "Как долго ждать ответа после отклика?",
        answer: "Обычно первичный просмотр происходит в течение 1-2 рабочих дней после завершения ярмарки. Вы получите уведомление в Telegram, если ваш профиль нас заинтересует."
    }
]

type Props = {
    onBack: () => void
}

export default function FAQScreen({ onBack }: Props) {
    const [openIdx, setOpenIdx] = useState<number | null>(0)

    return (
        <div className="w-full max-w-md animate-fade-in-up flex flex-col h-full max-h-[85vh]">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="nav-btn">←</button>
                <h1 className="text-2xl font-black text-white px-2">Помощь и FAQ</h1>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {FAQS.map((faq, i) => (
                    <div key={i} className="glass overflow-hidden">
                        <button
                            onClick={() => setOpenIdx(openIdx === i ? null : i)}
                            className="w-full p-5 flex items-center justify-between text-left hover:scale-[1.01] active:scale-[0.99] transition-transform"
                        >
                            <span className="text-sm font-bold text-gray-200 pr-4">{faq.question}</span>
                            <ChevronDown
                                size={18}
                                className={`text-blue-400 transition-transform duration-300 ${openIdx === i ? 'rotate-180' : ''}`}
                            />
                        </button>
                        <AnimatePresence>
                            {openIdx === i && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                >
                                    <div className="px-5 pb-5 pt-0 text-xs leading-relaxed text-gray-400 font-medium">
                                        {faq.answer}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}

                {/* Contact Support Card */}
                <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="text-blue-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">Остались вопросы?</h3>
                    <p className="text-[11px] text-gray-400 mb-4 px-4 line-relaxed">Наши рекрутеры на стенде UZINFOCOM готовы помочь вам в любое время!</p>
                    <div className="flex items-center justify-center gap-2 text-blue-400 font-bold text-[10px] uppercase tracking-widest">
                        <MapPin size={14} /> На площадке ярмарки
                    </div>
                </div>
            </div>

            <button onClick={onBack} className="btn-secondary w-full mt-6">
                Вернуться на главную
            </button>
        </div>
    )
}
