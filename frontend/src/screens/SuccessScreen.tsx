import React from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

type Props = {
    onRestart: () => void;
};

export default function SuccessScreen({ onRestart }: Props) {
    return (
        <div className="w-full max-w-md animate-fade-in-up flex flex-col items-center text-center p-6">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mb-8 border border-green-500/30"
            >
                <CheckCircle size={48} />
            </motion.div>

            <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Отклик отправлен!</h1>

            <p className="text-gray-400 mb-10 leading-relaxed">
                Ваши данные успешно переданы рекрутерам компании. Мы свяжемся с вами, если ваш профиль подойдет для вакансии.
            </p>

            <div className="w-full space-y-4">
                <button
                    onClick={onRestart}
                    className="w-full btn-primary py-4 px-6 flex items-center justify-center gap-3 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    На главную
                </button>
            </div>

            <p className="mt-8 text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] opacity-50">
                UStart • Career Fair 2026
            </p>
        </div>
    );
}
