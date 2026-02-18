
import React, { useState, useEffect } from 'react';
import { Save, Bot, Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';

export const SettingsView: React.FC = () => {
    const [botToken, setBotToken] = useState('');
    const [welcomeMessage, setWelcomeMessage] = useState('');
    const [aiParsing, setAiParsing] = useState(true);
    const [enableTickets, setEnableTickets] = useState(true);
    const [showToken, setShowToken] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get('/api/admin/settings');
            setBotToken(data.bot_token || '');
            setWelcomeMessage(data.welcome_message || '👋 Добро пожаловать в HR-Magnet!\n\nЯ помогу вам найти идеальную работу на этой ярмарке.');
            setEnableTickets(data.enable_tickets === 'true');
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axios.post('/api/admin/settings', {
                bot_token: botToken,
                welcome_message: welcomeMessage,
                enable_tickets: enableTickets ? 'true' : 'false'
            });
            // Show success (you might want a better toast system)
            alert('Настройки успешно сохранены!');
        } catch (err) {
            console.error('Save failed:', err);
            alert('Ошибка при сохранении настроек');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
                <span className="text-sm font-medium">Загрузка конфигурации...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold font-onest">Настройки системы</h2>
                    <p className="text-xs text-gray-500 uppercase font-black tracking-widest pl-1">Управление ботом и параметрами AI</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* Bot Configuration */}
                <div className="glass-panel p-8 space-y-8 border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Конфигурация бота</h3>
                            <p className="text-[10px] text-gray-500 font-medium">Связь с Telegram API</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="relative">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Telegram Bot Token</label>
                            <div className="relative group">
                                <input
                                    type={showToken ? "text" : "password"}
                                    value={botToken}
                                    onChange={e => setBotToken(e.target.value)}
                                    placeholder="578162..."
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 transition-all font-mono placeholder:text-gray-700"
                                />
                                <button
                                    onClick={() => setShowToken(!showToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                                >
                                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">Приветственное сообщение</label>
                            <textarea
                                value={welcomeMessage}
                                onChange={e => setWelcomeMessage(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 h-40 resize-none transition-all placeholder:text-gray-700 leading-relaxed"
                                placeholder="Введите приветственный текст для новых пользователей бота..."
                            />
                            <p className="mt-2 text-[10px] text-gray-600 italic">Поддерживается <b>HTML-разметка</b> (болд, курсив)</p>
                        </div>
                    </div>
                </div>

                {/* AI & Integration */}
                <div className="glass-panel p-8 space-y-8 border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white">AI и Парсинг</h3>
                            <p className="text-[10px] text-gray-500 font-medium">Интеллектуальный анализ резюме</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-blue-500/20 transition-all">
                            <div>
                                <div className="text-sm font-bold text-gray-200">Vision AI Parsing</div>
                                <div className="text-[11px] text-gray-500 mt-0.5">Автораспознавание текста с фото-резюме</div>
                            </div>
                            <button
                                onClick={() => setAiParsing(!aiParsing)}
                                className={`w-14 h-7 rounded-full transition-all relative flex items-center px-1 ${aiParsing ? 'bg-blue-600' : 'bg-gray-800'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-all shadow-md ${aiParsing ? 'translate-x-7' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-blue-500/20 transition-all">
                            <div>
                                <div className="text-sm font-bold text-gray-200">Система билетов и QR</div>
                                <div className="text-[11px] text-gray-500 mt-0.5">Генерация пропуска для получения подарков</div>
                            </div>
                            <button
                                onClick={() => setEnableTickets(!enableTickets)}
                                className={`w-14 h-7 rounded-full transition-all relative flex items-center px-1 ${enableTickets ? 'bg-blue-600' : 'bg-gray-800'}`}
                            >
                                <div className={`w-5 h-5 bg-white rounded-full transition-all shadow-md ${enableTickets ? 'translate-x-7' : 'translate-x-0'}`} />
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
