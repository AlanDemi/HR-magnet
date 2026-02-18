
export type CandidateStatus = 'NEW' | 'VIEWED' | 'INTERVIEW' | 'TEST_TASK' | 'OFFER' | 'HIRED' | 'REJECTED' | 'ARCHIVE';

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  source: string;
  status: string;
  date: string;
  avatar: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
}

export type ProfileData = {
  full_name: string;
  phone: string;
  email: string;
  skills: string[];
  about: string;
  experience_years?: number;
};

export type MatchedJob = {
  id: string;
  title: string;
  match_pct: number;
  matched_tags: string[];
};
