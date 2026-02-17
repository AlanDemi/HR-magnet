
import React, { useState } from 'react';
import { Save, Bot, Zap, Bell, ShieldCheck } from 'lucide-react';

export const SettingsView: React.FC = () => {
    const [botToken, setBotToken] = useState('••••••••••••••••');
    const [welcomeMessage, setWelcomeMessage] = useState('Привет! Я HR-бот компании. Пришли мне свое резюме.');
    const [aiParsing, setAiParsing] = useState(true);

    const handleSave = () => {
        alert('Настройки сохранены! (Демо)');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Настройки системы</h2>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition-colors font-bold"
                >
                    <Save size={18} /> Сохранить
                </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Bot Configuration */}
                <div className="glass-panel p-6 space-y-6">
                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                        <Bot size={20} />
                        <h3 className="text-sm font-bold uppercase tracking-widest">Конфигурация бота</h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Telegram Bot Token</label>
                            <input
                                type="password"
                                value={botToken}
                                onChange={e => setBotToken(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Приветственное сообщение</label>
                            <textarea
                                value={welcomeMessage}
                                onChange={e => setWelcomeMessage(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500/50 h-32 resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* AI & Integration */}
                <div className="glass-panel p-6 space-y-6">
                    <div className="flex items-center gap-3 text-orange-400 mb-2">
                        <Zap size={20} />
                        <h3 className="text-sm font-bold uppercase tracking-widest">AI и Парсинг</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div>
                                <div className="text-sm font-medium">Vision AI Parsing</div>
                                <div className="text-xs text-gray-500">Автораспознавание текста с фото-резюме</div>
                            </div>
                            <button
                                onClick={() => setAiParsing(!aiParsing)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${aiParsing ? 'bg-blue-600' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${aiParsing ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                                <ShieldCheck size={14} /> Уведомления администратора
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Новые отклики в Telegram</span>
                                <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-blue-600" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-300">Еженедельный отчет на Email</span>
                                <input type="checkbox" className="w-4 h-4 rounded bg-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
