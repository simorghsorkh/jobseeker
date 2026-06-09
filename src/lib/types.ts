export type ApplicationStatus =
  | "saved"
  | "preparing"
  | "applied"
  | "hr_review"
  | "interview_scheduled"
  | "technical_interview"
  | "final_interview"
  | "offer"
  | "rejected"
  | "accepted"
  | "ghosted";

export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "freelance"
  | "internship"
  | "temporary";

export type WorkMode = "remote" | "hybrid" | "onsite";

export type SeniorityLevel =
  | "intern"
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "manager"
  | "director"
  | "vp"
  | "c_level";

export type ApplicationSource =
  | "linkedin"
  | "indeed"
  | "glassdoor"
  | "company_website"
  | "referral"
  | "recruiter"
  | "job_board"
  | "other";

export type FileCategory =
  | "resume"
  | "cover_letter"
  | "certificate"
  | "portfolio"
  | "assignment"
  | "other";

export type ActivityType =
  | "status_change"
  | "note_added"
  | "file_uploaded"
  | "reminder_set"
  | "ai_generated"
  | "email_sent"
  | "interview_scheduled"
  | "offer_received"
  | "application_created";

export type ReminderType =
  | "follow_up"
  | "interview"
  | "deadline"
  | "recruiter_reply"
  | "other";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Application {
  id: string;
  user_id: string;

  // Basic Info
  company_name: string;
  job_title: string;
  job_url: string | null;
  job_description: string | null;
  industry: string | null;
  employment_type: EmploymentType | null;
  seniority_level: SeniorityLevel | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  location: string | null;
  work_mode: WorkMode | null;
  country: string | null;
  city: string | null;
  recruiter_name: string | null;
  recruiter_linkedin: string | null;
  contact_email: string | null;

  // New fields
  description_language: string | null;
  dutch_required: boolean | null;
  initial_notes: string | null;
  visa_sponsorship: "yes" | "no" | "maybe" | "eu_only" | null;
  contract_type: "permanent" | "fixed_term" | "temporary" | "payroll" | "zzp" | "internship" | null;
  lessons_learned: string | null;

  // Application Info
  status: ApplicationStatus;
  application_date: string | null;
  source: ApplicationSource | null;
  cv_version: string | null;
  cover_letter_used: string | null;
  portfolio_link: string | null;
  motivation_notes: string | null;
  why_this_role: string | null;
  match_score: number | null;

  // AI Fields
  ai_summary: string | null;
  ai_match_score: number | null;
  ai_interview_prep: string | null;

  // Meta
  is_bookmarked: boolean;
  is_archived: boolean;
  priority: number;
  tags: string[];

  created_at: string;
  updated_at: string;

  // Relations (joined)
  activities?: Activity[];
  notes?: Note[];
  files?: ApplicationFile[];
  reminders?: Reminder[];
}

export interface Activity {
  id: string;
  application_id: string;
  user_id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Note {
  id: string;
  application_id: string;
  user_id: string;
  title: string | null;
  content: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplicationFile {
  id: string;
  application_id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_url: string | null;
  file_size: number | null;
  file_type: string | null;
  category: FileCategory;
  created_at: string;
}

export interface Reminder {
  id: string;
  application_id: string;
  user_id: string;
  type: ReminderType;
  title: string;
  description: string | null;
  due_date: string;
  is_completed: boolean;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  application_id: string;
  user_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_at: string;
  note: string | null;
}

// UI/View types
export interface KanbanColumn {
  status: ApplicationStatus;
  label: string;
  color: string;
  bgColor: string;
  count: number;
  applications: Application[];
}

export interface DashboardStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  thisWeek: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
}

export interface FilterState {
  search: string;
  status: ApplicationStatus[];
  industry: string[];
  workMode: WorkMode[];
  seniority: SeniorityLevel[];
  source: ApplicationSource[];
  dateFrom: string | null;
  dateTo: string | null;
  isBookmarked: boolean | null;
  isArchived: boolean;
  tags: string[];
}

export type InterviewResult = "passed" | "failed" | "pending" | "rejected";
export type QuestionCategory = "technical" | "behavioral" | "company" | "role" | "general";

export interface InterviewRound {
  id: string;
  application_id: string;
  user_id: string;
  round_name: string;
  result: InterviewResult | null;
  interview_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface InterviewQuestion {
  id: string;
  application_id: string;
  user_id: string;
  question: string;
  answer: string | null;
  category: QuestionCategory;
  created_at: string;
  updated_at: string;
}

// ── Gamification ─────────────────────────────────────────────────────────────

export interface UserStats {
  user_id: string;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

export type GoalType =
  | "applications_total"
  | "applications_weekly"
  | "applications_monthly"
  | "interviews_total"
  | "custom";

export interface UserGoal {
  id: string;
  user_id: string;
  title: string;
  goal_type: GoalType;
  target_value: number;
  current_value: number;
  deadline: string | null;
  is_active: boolean;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
