# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- Fixed environment variable naming issue in `lib/db.ts` (changed `NEON_NEON_NEON_DATABASE_URL` to `NEON_DATABASE_URL`)
- Fixed environment variable naming issue in `lib/credits.ts` (changed `NEON_NEON_NEON_DATABASE_URL` to `NEON_DATABASE_URL`)
- Fixed Supabase environment variables in `lib/supabase/server.ts` (changed to use `NEXT_PUBLIC_` prefixed variables)
- Fixed Supabase environment variables in `lib/supabase/middleware.ts` (changed to use `NEXT_PUBLIC_` prefixed variables)
- Fixed README.md database script references to match actual filenames

### Added
- Added `.env.example` file for easier project setup
- Added environment variable validation utility (`lib/env.ts`)
- Added `ErrorBoundary` component for better error handling
- Added TypeScript type definitions (`lib/types.ts`)
- Added application constants (`lib/constants.ts`)
- Added comprehensive development guide (`DEVELOPMENT.md`)
- Added VS Code workspace settings (`.vscode/settings.json`)
- Enhanced `.gitignore` with better patterns

### Changed
- Updated README.md to use correct environment variable names
- Updated README.md with correct database script filenames

## [1.0.0] - 2025-10-29

### Initial Release
- AI-powered story and novel generation using Google Gemini
- User authentication with Supabase
- Credit-based generation system
- Personal story library
- Public story gallery
- Modern UI with dark mode support
- Real-time streaming of generated content
