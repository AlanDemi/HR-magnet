import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, Key, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || "/admin";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const { data } = await axios.post('/api/auth/login', formData);
            login(data.access_token, { username: data.username, role: data.role });
            navigate(from, { replace: true });
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.response?.data?.detail || 'Неверные учетные данные');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen circuit-bg flex items-center justify-center p-4 font-onest">
            <div className="w-full max-w-md animate-fade-in">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-6 shadow-xl shadow-blue-500/5">
                        <Lock size={40} />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Вход в UStart</h1>
                    <p className="text-gray-500 uppercase text-[10px] font-black tracking-[0.3em]">Панель управления</p>
                </div>

                <div className="glass-panel p-8 space-y-6 border-white/5 bg-white/[0.02] backdrop-blur-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Имя пользователя</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Username"
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all text-white placeholder:text-gray-700"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Пароль</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors">
                                    <Key size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all text-white placeholder:text-gray-700"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold p-4 rounded-xl text-center animate-shake">
                                {String(error)}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !username || !password}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-4 rounded-2xl transition-all font-black text-sm shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Войти
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-8 text-center text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] opacity-40">
                    UZINFOCOM • Career Fair 2026 Internal
                </p>
            </div>
        </div>
    );
}
