-- ============================================================
-- JobFlow AI — Example Seed Data
-- Replace 'YOUR_USER_ID' with an actual Supabase auth user ID
-- ============================================================

DO $$
DECLARE
  uid UUID := 'YOUR_USER_ID_HERE'; -- Replace with your user ID
  app1 UUID := uuid_generate_v4();
  app2 UUID := uuid_generate_v4();
  app3 UUID := uuid_generate_v4();
  app4 UUID := uuid_generate_v4();
  app5 UUID := uuid_generate_v4();
  app6 UUID := uuid_generate_v4();
  app7 UUID := uuid_generate_v4();
BEGIN

-- ============================================================
-- APPLICATIONS
-- ============================================================
INSERT INTO applications (id, user_id, company_name, job_title, status, work_mode, employment_type,
  seniority_level, location, industry, source, application_date, salary_min, salary_max,
  salary_currency, ai_match_score, is_bookmarked, job_description)
VALUES
  (app1, uid, 'Stripe', 'Senior Frontend Engineer', 'technical_interview', 'remote', 'full_time',
   'senior', 'San Francisco, CA', 'Technology', 'linkedin', CURRENT_DATE - 14,
   180000, 220000, 'USD', 87, true,
   'We are looking for a Senior Frontend Engineer to help build the next generation of payment infrastructure. You will work closely with product and design teams to create delightful user experiences using React, TypeScript, and modern web technologies.'),

  (app2, uid, 'Linear', 'Product Designer', 'interview_scheduled', 'remote', 'full_time',
   'mid', 'Remote', 'Technology', 'company_website', CURRENT_DATE - 7,
   130000, 160000, 'USD', 74, false,
   'Join our small but mighty design team to shape the future of project management tools. We value systems thinking, attention to detail, and strong opinions weakly held.'),

  (app3, uid, 'Vercel', 'Staff Software Engineer', 'hr_review', 'remote', 'full_time',
   'lead', 'Remote', 'Technology', 'referral', CURRENT_DATE - 10,
   200000, 260000, 'USD', 91, true,
   'Help us build the future of the web. We are looking for a Staff Engineer to lead architecture decisions across our deployment platform.'),

  (app4, uid, 'Notion', 'Senior Product Manager', 'applied', 'hybrid', 'full_time',
   'senior', 'San Francisco, CA', 'Technology', 'linkedin', CURRENT_DATE - 3,
   160000, 200000, 'USD', 68, false,
   'We are hiring a Senior PM to own our API and developer ecosystem products.'),

  (app5, uid, 'Figma', 'Engineering Manager', 'offer', 'hybrid', 'full_time',
   'manager', 'San Francisco, CA', 'Technology', 'recruiter', CURRENT_DATE - 21,
   220000, 280000, 'USD', 82, true,
   'Lead a team of 6-8 engineers building collaborative design tools. Strong track record of shipping complex products required.'),

  (app6, uid, 'Shopify', 'Senior Backend Engineer', 'rejected', 'remote', 'full_time',
   'senior', 'Remote', 'Technology', 'indeed', CURRENT_DATE - 25,
   150000, 190000, 'USD', 55, false,
   'Build the commerce platform that powers millions of businesses.'),

  (app7, uid, 'Anthropic', 'Senior Software Engineer', 'saved', 'hybrid', 'full_time',
   'senior', 'San Francisco, CA', 'Technology', 'linkedin', NULL,
   190000, 240000, 'USD', NULL, true,
   'Help us build safe and beneficial AI systems. We are looking for engineers passionate about the frontier of AI.');

-- ============================================================
-- ACTIVITIES
-- ============================================================
INSERT INTO activities (application_id, user_id, type, title, description)
VALUES
  (app1, uid, 'application_created', 'Application submitted', 'Applied via LinkedIn'),
  (app1, uid, 'status_change', 'Status changed to HR Review', 'From "applied" to "hr_review"'),
  (app1, uid, 'status_change', 'Status changed to Technical Interview', 'Recruiter reached out to schedule'),
  (app2, uid, 'application_created', 'Application submitted', 'Applied via company website'),
  (app2, uid, 'status_change', 'Status changed to Interview Scheduled', 'First round scheduled for next week'),
  (app3, uid, 'application_created', 'Application submitted', 'Referred by John Doe'),
  (app5, uid, 'application_created', 'Application submitted', 'Recruiter reached out'),
  (app5, uid, 'status_change', 'Status changed to Offer', 'Verbal offer received!');

-- ============================================================
-- NOTES
-- ============================================================
INSERT INTO notes (application_id, user_id, title, content, is_pinned)
VALUES
  (app1, uid, 'Interview notes', 'First round was a system design interview. Discussed building a distributed rate limiter. Went well overall — interviewer seemed engaged. Follow up with questions about team structure.', true),
  (app5, uid, 'Offer details', 'Base: $240k, Equity: 0.2% (4yr vest), Bonus: 15%. Need to decide by end of month. Compare with Linear offer.', true),
  (app2, uid, 'Research notes', 'Linear uses Electron + React. Design team is 4 people. CEO is very design-focused. Read their design blog posts before interview.', false);

-- ============================================================
-- REMINDERS
-- ============================================================
INSERT INTO reminders (application_id, user_id, type, title, due_date)
VALUES
  (app1, uid, 'follow_up', 'Send thank you email after technical round', NOW() + INTERVAL '1 day'),
  (app2, uid, 'interview', 'First round interview with Linear', NOW() + INTERVAL '3 days'),
  (app5, uid, 'deadline', 'Deadline to respond to Figma offer', NOW() + INTERVAL '5 days'),
  (app4, uid, 'follow_up', 'Follow up on Notion application', NOW() + INTERVAL '7 days');

END $$;
