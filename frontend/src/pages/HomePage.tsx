import React, { useState } from 'react';
import axios from 'axios';
import DashboardScreen from '../screens/DashboardScreen';
import FAQScreen from '../screens/FAQScreen';
import WizardScreen from '../screens/WizardScreen';
import LoadingScreen from '../screens/LoadingScreen';
import VerifyScreen from '../screens/VerifyScreen';
import ResultsScreen from '../screens/ResultsScreen';
import TicketScreen from '../screens/TicketScreen';
import SuccessScreen from '../screens/SuccessScreen';
import { ProfileData, MatchedJob } from '../types';
import { useEffect } from 'react';

const HomePage: React.FC = () => {
    const [view, setView] = useState<'dashboard' | 'faq' | 'wizard' | 'loading' | 'verify' | 'results' | 'ticket' | 'browse' | 'success'>('dashboard');
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [ticketsEnabled, setTicketsEnabled] = useState(false);
    const [matchedJobs, setMatchedJobs] = useState<MatchedJob[]>([]);
    const [selectedJob, setSelectedJob] = useState<MatchedJob | null>(null);
    const [parsedData, setParsedData] = useState<any>(null);
    const [loadingText, setLoadingText] = useState<string | undefined>(undefined);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get(`/api/settings?t=${Date.now()}`);
                const isEnabled = String(data.enable_tickets).toLowerCase() === 'true';
                setTicketsEnabled(isEnabled);
            } catch (err) {
                console.error('Failed to fetch global settings:', err);
            }
        };
        fetchSettings();
    }, []);

    const handleComplete = async (data: ProfileData) => {
        setProfile(data);
        setLoadingText(undefined);
        setView('loading');
        try {
            const resp = await axios.post('/api/candidates', {
                ...data,
                source: 'manual'
            });
            setMatchedJobs(resp.data.matched_jobs || []);
            setTimeout(() => setView('results'), 1500);
        } catch (err) {
            console.error('Submission failed:', err);
            setView('results');
        }
    };

    const handleFileUpload = async (file: File) => {
        setLoadingText(undefined);
        setView('loading');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const resp = await axios.post('/api/parse-resume', formData);
            if (resp.data.profile) {
                // Prepare data for VerifyScreen
                const p = resp.data.profile;
                setParsedData({
                    full_name: p.full_name || '',
                    phone: p.phone || '',
                    email: p.email || '',
                    skills: p.skills || [],
                    experience_years: p.experience_years || 0,
                    summary: p.about || p.summary || '',
                    resume_filename: file.name
                });
                setView('verify');
            } else {
                // If parsing fails but we have jobs (fallback)
                setMatchedJobs(resp.data.matched_jobs || []);
                setView('results');
            }
        } catch (err) {
            console.error('Upload failed:', err);
            setView('dashboard');
        }
    };

    const handleConfirmParsed = async (data: any) => {
        setProfile({
            full_name: data.full_name,
            phone: data.phone,
            email: data.email,
            skills: data.skills,
            about: data.summary
        });
        setLoadingText(undefined);
        setView('loading');
        try {
            const resp = await axios.post('/api/candidates', {
                full_name: data.full_name,
                phone: data.phone,
                email: data.email,
                skills: data.skills,
                about: data.summary,
                resume_filename: data.resume_filename,
                source: 'resume_upload'
            });
            setMatchedJobs(resp.data.matched_jobs || []);
            setTimeout(() => setView('results'), 1500);
        } catch (err) {
            console.error('Final submission failed:', err);
            setView('results');
        }
    };

    const handleApply = async (job: MatchedJob) => {
        setSelectedJob(job);

        // Re-fetch settings before final decision to avoid stale state
        try {
            const { data } = await axios.get(`/api/settings?t=${Date.now()}`);
            const isEnabled = String(data.enable_tickets).toLowerCase() === 'true';

            if (isEnabled) {
                setView('ticket');
            } else {
                setView('success');
            }
        } catch (err) {
            console.error('Failed to fetch settings before apply:', err);
            // Fallback to current local state if API fails
            if (ticketsEnabled) setView('ticket');
            else setView('success');
        }
    };

    const handleRestart = () => {
        setProfile(null);
        setMatchedJobs([]);
        setSelectedJob(null);
        setParsedData(null);
        setView('dashboard');
    };

    const handleViewAllJobs = async () => {
        setLoadingText("Загрузка списка вакансий...");
        setView('loading');
        try {
            const resp = await axios.get('/api/admin/vacancies');
            // Mock matched jobs for "Browse" view
            setMatchedJobs(resp.data.map((v: any) => ({
                id: v.id,
                title: v.title,
                match_pct: 0,
                matched_tags: []
            })));
            setTimeout(() => setView('browse'), 500);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
            setView('dashboard');
        }
    };

    return (
        <div className="min-h-screen circuit-bg flex items-center justify-center p-4 font-onest overflow-x-hidden">
            {view === 'dashboard' && (
                <DashboardScreen
                    onStartManual={() => setView('wizard')}
                    onStartResume={handleFileUpload}
                    onViewFAQ={() => setView('faq')}
                    onViewAllJobs={handleViewAllJobs}
                />
            )}
            {view === 'faq' && (
                <FAQScreen onBack={() => setView('dashboard')} />
            )}
            {view === 'wizard' && (
                <WizardScreen
                    onComplete={handleComplete}
                    onFileUpload={handleFileUpload}
                    onBack={() => setView('dashboard')}
                />
            )}
            {view === 'verify' && parsedData && (
                <VerifyScreen
                    data={parsedData}
                    onConfirm={handleConfirmParsed}
                    onBack={() => setView('dashboard')}
                />
            )}
            {view === 'loading' && (
                <LoadingScreen name={profile?.full_name || ''} customText={loadingText} />
            )}
            {view === 'results' && (
                <ResultsScreen jobs={matchedJobs} onApply={handleApply} onRestart={handleRestart} />
            )}
            {view === 'browse' && (
                <ResultsScreen jobs={matchedJobs} onApply={handleApply} onRestart={handleRestart} isBrowseMode={true} />
            )}
            {view === 'ticket' && selectedJob && (
                <TicketScreen
                    name={profile?.full_name || 'Гость'}
                    job={selectedJob}
                    onRestart={handleRestart}
                />
            )}
            {view === 'success' && (
                <SuccessScreen onRestart={handleRestart} />
            )}
        </div>
    );
};

export default HomePage;
