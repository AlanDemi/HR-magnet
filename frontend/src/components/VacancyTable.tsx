
import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';

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
    const [formData, setFormData] = useState({ id: '', title: '', tags: '' });

    const slugify = (text: string) => {
        const ru = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
            'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
            'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
            'ч': 'ch', 'ш': 'sh', 'щ': 'shh', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };

        let str = text.toLowerCase();
        let transliterated = "";
        for (let i = 0; i < str.length; i++) {
            transliterated += ru[str[i] as keyof typeof ru] || str[i];
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({
            id: formData.id || slugify(formData.title),
            title: formData.title,
            tags_json: formData.tags.split(',').map(s => s.trim()).filter(Boolean)
        });
        setIsFormOpen(false);
        setFormData({ id: '', title: '', tags: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Управление вакансиями</h2>
                <button
                    onClick={() => {
                        setFormData({ id: '', title: '', tags: '' });
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-medium"
                >
                    <Plus size={18} /> Новая вакансия
                </button>
            </div>

            <div className="space-y-3">
                {vacancies.map((v) => (
                    <div key={v.id} className="glass-panel p-5 flex items-center justify-between group hover:bg-white/5 transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg font-bold">{v.title}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${v.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {v.is_active ? 'Активна' : 'Архив'}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">ID: {v.id}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {v.tags_json.map(tag => (
                                    <span key={tag} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] text-gray-400">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => onUpdate(v.id, { is_active: v.is_active ? 0 : 1 })}
                                className={`p-2 rounded-lg transition-colors border ${v.is_active ? 'text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10' : 'text-green-400 border-green-400/30 hover:bg-green-400/10'}`}
                                title={v.is_active ? "В архив" : "Активировать"}
                            >
                                {v.is_active ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                            </button>
                            <button
                                className="p-2 rounded-lg text-blue-400 border border-blue-400/30 hover:bg-blue-400/10 transition-colors"
                                title="Редактировать"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => onDelete(v.id)}
                                className="p-2 rounded-lg text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors"
                                title="Удалить"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* New Vacancy Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-panel w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-6">Создание вакансии</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Заголовок</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500/50 placeholder:text-gray-600"
                                    placeholder="Senior Python Developer"
                                    value={formData.title}
                                    onChange={e => handleTitleChange(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ID (формируется автоматически)</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500/50 text-gray-400 placeholder:text-gray-600 font-mono"
                                    placeholder="senior-python-developer"
                                    value={formData.id}
                                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Теги (через запятую)</label>
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500/50 h-24 placeholder:text-gray-600"
                                    placeholder="Python, FastAPI, PostgreSQL, Docker"
                                    value={formData.tags}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="flex-1 py-3 rounded-xl hover:bg-white/5 border border-white/10 text-sm font-bold transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all"
                                >
                                    Создать
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
