
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Vacancy {
    id: string;
    title: string;
    tags_json: string[];
    is_active: number;
    created_at: string;
}

interface VacancyTableProps {
    vacancies: Vacancy[];
    onCreate: (v: { id: string, title: string, tags_json: string[] }) => void;
    onUpdate: (id: string, data: any) => void;
    onDelete: (id: string) => void;
}

export const VacancyTable: React.FC<VacancyTableProps> = ({ vacancies, onCreate, onUpdate, onDelete }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ id: '', title: '', tags: '' });

    useEffect(() => {
        if (isFormOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isFormOpen]);

    const slugify = (text: string) => {
        const ru: Record<string, string> = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
            'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
            'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
            'ч': 'ch', 'ш': 'sh', 'щ': 'shh', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };

        let str = text.toLowerCase();
        let transliterated = "";
        for (let i = 0; i < str.length; i++) {
            transliterated += ru[str[i]] || str[i];
        }

        return transliterated
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const handleTitleChange = (val: string) => {
        const newSlug = slugify(val);
        setFormData(prev => ({
            ...prev,
            title: val,
            id: prev.id === slugify(prev.title) || prev.id === '' ? newSlug : prev.id
        }));
    };

    const handleEdit = (v: Vacancy) => {
        setFormData({
            id: v.id,
            title: v.title,
            tags: v.tags_json.join(', ')
        });
        setIsEditing(true);
        setIsFormOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            id: formData.id || slugify(formData.title),
            title: formData.title,
            tags_json: formData.tags.split(',').map(s => s.trim()).filter(Boolean)
        };

        if (isEditing) {
            onUpdate(formData.id, data);
        } else {
            onCreate(data);
        }

        setIsFormOpen(false);
        setIsEditing(false);
        setFormData({ id: '', title: '', tags: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-onest">Управление вакансиями</h2>
                <button
                    onClick={() => {
                        setFormData({ id: '', title: '', tags: '' });
                        setIsEditing(false);
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-bold text-sm shadow-lg shadow-blue-600/20"
                >
                    <Plus size={18} /> Новая вакансия
                </button>
            </div>

            <div className="space-y-3">
                {vacancies.map((v) => (
                    <div key={v.id} className="glass-panel p-5 flex items-center justify-between group hover:bg-white/[0.03] transition-colors border-white/5">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg font-bold text-gray-200">{v.title}</span>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${v.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                    {v.is_active ? 'Активна' : 'Архив'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono opacity-50 uppercase tracking-widest">ID: {v.id}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {v.tags_json.map((tag, idx) => (
                                    <span key={tag} className="px-2 py-1 rounded-md bg-blue-500/5 border border-blue-500/10 text-[9px] text-blue-400 uppercase font-black">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onUpdate(v.id, { is_active: v.is_active ? 0 : 1 })}
                                className={`p-2.5 rounded-xl transition-all border ${v.is_active ? 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5 hover:bg-yellow-400/10' : 'text-green-400 border-green-400/20 bg-green-400/5 hover:bg-green-400/10'}`}
                                title={v.is_active ? "В архив" : "Активировать"}
                            >
                                {v.is_active ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                            </button>
                            <button
                                onClick={() => handleEdit(v)}
                                className="p-2.5 rounded-xl text-blue-400 border border-blue-400/20 bg-blue-400/5 hover:bg-blue-400/10 transition-all"
                                title="Редактировать"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => onDelete(v.id)}
                                className="p-2.5 rounded-xl text-red-400 border border-red-400/20 bg-red-400/5 hover:bg-red-400/10 transition-all"
                                title="Удалить"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* New/Edit Vacancy Modal */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => { setIsFormOpen(false); setIsEditing(false); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[#0c121d] w-full max-w-md p-8 shadow-2xl overflow-hidden relative rounded-[2rem] border border-white/5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                            <h3 className="text-xl font-bold mb-6">{isEditing ? 'Редактирование вакансии' : 'Создание вакансии'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Заголовок</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 placeholder:text-gray-700 transition-all"
                                        placeholder="Senior Python Developer"
                                        value={formData.title}
                                        onChange={e => handleTitleChange(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 pl-1">ID (формируется автоматически)</label>
                                    <input
                                        required
                                        type="text"
                                        disabled={isEditing}
                                        className={`w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 font-mono transition-all ${isEditing ? 'opacity-40 grayscale cursor-not-allowed' : 'text-gray-400'}`}
                                        placeholder="senior-python-developer"
                                        value={formData.id}
                                        onChange={e => setFormData({ ...formData, id: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 pl-1">Теги (через запятую)</label>
                                    <textarea
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 h-28 placeholder:text-gray-700 transition-all resize-none"
                                        placeholder="Python, FastAPI, PostgreSQL, Docker"
                                        value={formData.tags}
                                        onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setIsFormOpen(false); setIsEditing(false); }}
                                        className="flex-1 py-3.5 rounded-xl hover:bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                                    >
                                        {isEditing ? 'Сохранить' : 'Создать'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
