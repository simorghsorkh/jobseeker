import type { ApplicationStatus, EmploymentType, WorkMode, SeniorityLevel, ApplicationSource } from "./types";

export const STATUS_CONFIG: Record<ApplicationStatus, {
  label: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  saved: {
    label: "Saved",
    color: "#6b7280",
    bgColor: "bg-gray-100",
    darkBgColor: "dark:bg-gray-800",
    textColor: "text-gray-600 dark:text-gray-400",
    borderColor: "border-gray-200 dark:border-gray-700",
  },
  preparing: {
    label: "Preparing",
    color: "#8b5cf6",
    bgColor: "bg-violet-100",
    darkBgColor: "dark:bg-violet-900/30",
    textColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
  applied: {
    label: "Applied",
    color: "#3b82f6",
    bgColor: "bg-blue-100",
    darkBgColor: "dark:bg-blue-900/30",
    textColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  hr_review: {
    label: "HR Review",
    color: "#0ea5e9",
    bgColor: "bg-sky-100",
    darkBgColor: "dark:bg-sky-900/30",
    textColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-200 dark:border-sky-800",
  },
  interview_scheduled: {
    label: "Interview",
    color: "#f59e0b",
    bgColor: "bg-amber-100",
    darkBgColor: "dark:bg-amber-900/30",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  technical_interview: {
    label: "Technical",
    color: "#f97316",
    bgColor: "bg-orange-100",
    darkBgColor: "dark:bg-orange-900/30",
    textColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  final_interview: {
    label: "Final Interview",
    color: "#ef4444",
    bgColor: "bg-red-100",
    darkBgColor: "dark:bg-red-900/30",
    textColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800",
  },
  offer: {
    label: "Offer",
    color: "#10b981",
    bgColor: "bg-emerald-100",
    darkBgColor: "dark:bg-emerald-900/30",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  rejected: {
    label: "Rejected",
    color: "#6b7280",
    bgColor: "bg-gray-100",
    darkBgColor: "dark:bg-gray-800",
    textColor: "text-gray-500 dark:text-gray-500",
    borderColor: "border-gray-200 dark:border-gray-700",
  },
  accepted: {
    label: "Accepted",
    color: "#22c55e",
    bgColor: "bg-green-100",
    darkBgColor: "dark:bg-green-900/30",
    textColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
  },
  ghosted: {
    label: "Ghosted",
    color: "#9ca3af",
    bgColor: "bg-gray-100",
    darkBgColor: "dark:bg-gray-800",
    textColor: "text-gray-400 dark:text-gray-500",
    borderColor: "border-gray-200 dark:border-gray-700",
  },
};

export const KANBAN_STATUSES: ApplicationStatus[] = [
  "saved",
  "preparing",
  "applied",
  "hr_review",
  "interview_scheduled",
  "technical_interview",
  "final_interview",
  "offer",
  "accepted",
  "rejected",
  "ghosted",
];

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" },
];

export const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

export const SENIORITY_LEVELS: { value: SeniorityLevel; label: string }[] = [
  { value: "intern", label: "Intern" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid-Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
  { value: "vp", label: "VP" },
  { value: "c_level", label: "C-Level" },
];

export const APPLICATION_SOURCES: { value: ApplicationSource; label: string }[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "glassdoor", label: "Glassdoor" },
  { value: "company_website", label: "Company Website" },
  { value: "referral", label: "Referral" },
  { value: "recruiter", label: "Recruiter" },
  { value: "job_board", label: "Job Board" },
  { value: "other", label: "Other" },
];

export const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Retail",
  "Manufacturing",
  "Consulting",
  "Media",
  "Real Estate",
  "Automotive",
  "Aerospace",
  "Energy",
  "Legal",
  "Marketing",
  "Non-Profit",
  "Government",
  "Hospitality",
  "Logistics",
  "Telecommunications",
  "Other",
];

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "CHF", "JPY", "SGD", "INR"];

export const VISA_SPONSORSHIP_OPTIONS = [
  { value: "yes",     label: "✅ Yes — Sponsors visas" },
  { value: "maybe",   label: "🤔 Maybe — Case by case" },
  { value: "eu_only", label: "🇪🇺 EU citizens only" },
  { value: "no",      label: "❌ No — Does not sponsor" },
] as const;

export const CONTRACT_TYPE_OPTIONS = [
  { value: "permanent",  label: "Permanent (Onbepaalde tijd)" },
  { value: "fixed_term", label: "Fixed-term (Bepaalde tijd)" },
  { value: "temporary",  label: "Temporary" },
  { value: "payroll",    label: "Payroll" },
  { value: "zzp",        label: "ZZP / Freelance" },
  { value: "internship", label: "Internship / Stage" },
] as const;

export const DESCRIPTION_LANGUAGES = [
  "English",
  "Dutch",
  "German",
  "French",
  "Spanish",
  "Italian",
  "Portuguese",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
  "Polish",
  "Czech",
  "Romanian",
  "Hungarian",
  "Other",
];

export const TAG_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#14b8a6",
  "#3b82f6",
  "#0ea5e9",
  "#6b7280",
];
