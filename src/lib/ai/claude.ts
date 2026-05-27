// AI service using Anthropic Claude API

const CLAUDE_MODEL = "claude-sonnet-4-6";

async function callClaude(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      system: systemPrompt,
      prompt,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "AI request failed");
  }

  const data = await response.json();
  return data.content;
}

export async function generateJobSummary(jobDescription: string): Promise<string> {
  return callClaude(
    `Summarize this job description in 3-4 concise bullet points, focusing on: role, key responsibilities, required skills, and company culture. Format as markdown bullets.\n\nJob Description:\n${jobDescription}`,
    "You are an expert career coach. Be concise and insightful."
  );
}

export async function generateMatchScore(
  cvContent: string,
  jobDescription: string
): Promise<{ score: number; analysis: string }> {
  const result = await callClaude(
    `Analyze this CV against the job description. Return a JSON object with: score (0-100 integer), strengths (array of 3 strings), gaps (array of 3 strings), summary (1 sentence).

CV:
${cvContent}

Job Description:
${jobDescription}

Return ONLY valid JSON.`,
    "You are an expert ATS and recruiter. Be objective and specific."
  );

  try {
    const parsed = JSON.parse(result.trim());
    return {
      score: Math.min(100, Math.max(0, parseInt(parsed.score) || 0)),
      analysis: JSON.stringify(parsed),
    };
  } catch {
    return { score: 0, analysis: result };
  }
}

export async function generateInterviewPrep(
  jobTitle: string,
  jobDescription: string,
  company: string
): Promise<string> {
  return callClaude(
    `Generate 10 targeted interview preparation questions for this role at ${company}. Include behavioral, technical, and culture-fit questions. Also include 2 smart questions the candidate should ask the interviewer. Format as markdown.

Job Title: ${jobTitle}
Job Description:
${jobDescription}`,
    "You are an expert interview coach with 20 years of hiring experience."
  );
}

export async function generateCoverLetter(
  jobTitle: string,
  company: string,
  jobDescription: string,
  cvHighlights: string,
  motivationNotes?: string
): Promise<string> {
  return callClaude(
    `Write a compelling, personalized cover letter for this position. Make it professional, specific, and under 350 words. Avoid clichés.

Position: ${jobTitle} at ${company}
Key Requirements from JD: ${jobDescription.slice(0, 1000)}
Candidate Highlights: ${cvHighlights}
${motivationNotes ? `Personal Motivation: ${motivationNotes}` : ""}`,
    "You are an expert cover letter writer. Write naturally and compellingly."
  );
}

export async function generateFollowUpEmail(
  jobTitle: string,
  company: string,
  recruiterName: string | null,
  applicationDate: string,
  context?: string
): Promise<string> {
  return callClaude(
    `Write a professional, concise follow-up email for a job application. Keep it under 150 words.

Job: ${jobTitle} at ${company}
${recruiterName ? `Recruiter: ${recruiterName}` : ""}
Applied: ${applicationDate}
${context ? `Context: ${context}` : ""}`,
    "You are a career coach. Write professional, warm follow-up emails."
  );
}

export async function extractJobInfo(jobText: string): Promise<Partial<{
  company_name: string;
  job_title: string;
  location: string;
  work_mode: string;
  employment_type: string;
  seniority_level: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  industry: string;
  job_description: string;
}>> {
  const result = await callClaude(
    `Extract structured information from this job posting. Return ONLY valid JSON with these fields: company_name, job_title, location, work_mode (remote/hybrid/onsite), employment_type (full_time/part_time/contract/internship), seniority_level (intern/junior/mid/senior/lead/manager/director), salary_min (number or null), salary_max (number or null), salary_currency (USD/EUR/GBP etc), industry, job_description (clean summary).

Job Posting:
${jobText}

Return ONLY valid JSON, no other text.`,
    "You are a data extraction expert. Extract accurately and return valid JSON only."
  );

  try {
    const cleaned = result.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

export async function generateCVSuggestions(
  jobDescription: string,
  cvContent: string
): Promise<string> {
  return callClaude(
    `Analyze this CV and job description. Provide 5 specific, actionable suggestions to better align the CV with this role. Focus on keywords, accomplishments, and formatting. Format as numbered list.

Job Description:
${jobDescription.slice(0, 1000)}

CV Content:
${cvContent}`,
    "You are an expert resume writer and career coach."
  );
}
