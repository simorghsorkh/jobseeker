-- Migration: Add extended fields to applications table
-- Run this in Supabase SQL Editor if you already have the base schema

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS description_language TEXT,
  ADD COLUMN IF NOT EXISTS dutch_required       BOOLEAN,
  ADD COLUMN IF NOT EXISTS initial_notes        TEXT,
  ADD COLUMN IF NOT EXISTS visa_sponsorship     TEXT CHECK (visa_sponsorship IN ('yes','no','maybe','eu_only')),
  ADD COLUMN IF NOT EXISTS contract_type        TEXT CHECK (contract_type IN ('permanent','fixed_term','temporary','payroll','zzp','internship'));
