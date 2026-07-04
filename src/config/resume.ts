import { ROLE } from '../consts';

export const LOCATION = 'Batumi, Georgia';

export type Job = { company: string; period: string; title: string };

export const WORK_HISTORY: Job[] = [
  { company: 'Apliteni OÜ', period: '2020 - Present', title: ROLE },
  { company: 'AG.digital', period: '2020', title: 'Senior Full-stack Developer' },
  { company: 'ConstLab, LLC', period: '2014 - 2020', title: 'Full-stack Developer' },
  { company: 'BSGroup', period: '2010 - 2014', title: 'Full-stack Developer' },
];

export type ExpertiseArea = { category: string; skills: string[] };

export const EXPERTISE: ExpertiseArea[] = [
  { category: 'Frontend', skills: ['React', 'TypeScript', 'Next.js', 'Vue.js'] },
  { category: 'Backend', skills: ['Node.js', 'NestJS', 'GraphQL', 'REST APIs'] },
  { category: 'Infrastructure', skills: ['CI/CD', 'Docker', 'Testing', 'Performance'] },
  { category: 'Leadership', skills: ['Mentoring', 'Code Review', 'Hiring', 'Onboarding'] },
];
