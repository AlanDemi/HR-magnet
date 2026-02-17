
import React, { useState } from 'react';
import axios from 'axios';
import WizardScreen from '../screens/WizardScreen';
import LoadingScreen from '../screens/LoadingScreen';
import ResultsScreen from '../screens/ResultsScreen';
import TicketScreen from '../screens/TicketScreen';
import { ProfileData, MatchedJob } from '../types';

const HomePage: React.FC = () => {
    const [view, setView] = useState<'wizard' | 'loading' | 'results' | 'ticket'>('wizard');
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [matchedJobs, setMatchedJobs] = useState<MatchedJob[]>([]);
    const [selectedJob, setSelectedJob] = useState<MatchedJob | null>(null);

    const handleComplete = async (data: ProfileData) => {
        setProfile(data);
        setView('loading');
        try {
            const resp = await axios.post('/api/candidates', {
                ...data,
                source: 'manual'
            });
            setMatchedJobs(resp.data.matched_jobs || []);
            setTimeout(() => setView('results'), 1500); // Artificial delay for UX
        } catch (err) {
            console.error('Submission failed:', err);
            setView('results');
        }
    };

    const handleFileUpload = async (file: File) => {
        setView('loading');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const resp = await axios.post('/api/parse-resume', formData);
            if (resp.data.profile) {
                setProfile(resp.data.profile);
            }
            setMatchedJobs(resp.data.matched_jobs || []);
            setTimeout(() => setView('results'), 2000);
        } catch (err) {
            console.error('Upload failed:', err);
            setView('wizard');
        }
    };

    const handleApply = (job: MatchedJob) => {
        setSelectedJob(job);
        setView('ticket');
    };

    const handleRestart = () => {
        setProfile(null);
        setMatchedJobs([]);
        setSelectedJob(null);
        setView('wizard');
    };

    return (
        <div className="min-h-screen circuit-bg flex items-center justify-center p-4 font-onest">
            {view === 'wizard' && (
                <WizardScreen onComplete={handleComplete} onFileUpload={handleFileUpload} />
            )}
            {view === 'loading' && (
                <LoadingScreen name={profile?.full_name || ''} />
            )}
            {view === 'results' && (
                <ResultsScreen jobs={matchedJobs} onApply={handleApply} />
            )}
            {view === 'ticket' && selectedJob && (
                <TicketScreen
                    name={profile?.full_name || 'Гость'}
                    job={selectedJob}
                    onRestart={handleRestart}
                />
            )}
        </div>
    );
};

export default HomePage;
