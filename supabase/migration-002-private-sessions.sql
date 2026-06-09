-- Migration 002: Support private sessions with custom time slots
-- Run this AFTER migration.sql

-- Make slot_id nullable (private sessions don't use predefined slots)
alter table public.sessions alter column slot_id drop not null;

-- Make package_id nullable (private sessions may not belong to a package)
alter table public.sessions alter column package_id drop not null;
