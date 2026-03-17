# Changelog

All notable changes to Apex are documented here.
This project follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added

- Automated welcome emails containing app instructions and WhatsApp community links are now sent to users upon successful sign-up

### Improved

- Extracted and centralized email sending logic in backend utilities for better maintainability

---

## [1.6.7] - 2026-03-17
### Fixed
- Book delete now correctly removes highlights, bookmarks and reading progress stored by Supabase UUID bookId
- Pull sync now writes updated Dexie integer IDs back as local_id after bulkAdd
- Delete no longer reverts on refresh

---

## [1.6.6] - 2026-03-17
### Fixed
- Book delete now correctly removes from Dexie (books, highlights, bookmarks, reading_progress)
- Book delete now correctly queues Supabase delete using supabaseId instead of recordId
- Offline deletes queued and synced when back online

### Added
- Reusable ConfirmModal component
- Book delete confirmation modal before permanent deletion
- Clear App Data — two options: device only or everything (cloud + device)
- DELETE /api/books/all endpoint for bulk cloud delete

---

## [1.6.5] - 2026-03-13

### Added

- Existing user onboarding screen for accounts created before personalization was introduced
- New PATCH /api/auth/onboarding endpoint
- Onboarding screen triggers automatically for any user with null user_type on login

---

## [1.6.4] - 2026-03-13

### Added

- Two-step signup flow with personalization onboarding
- User type, study goals, exam date and device preference collected on signup
- Single POST /api/auth/register now accepts all onboarding fields together

---

## [1.6.3] - 2026-03-10

### Fixed

- PDF reader now works offline — worker file is precached by service worker
- Resolved "Setting up fake worker" error when opening books without internet

### Infrastructure

- Migrated chat storage from legacy ApexBooksDB into ApexDB (Dexie)
- Deleted ApexBooksDB ghost database on client devices via one-time cleanup
- PDF worker (.mjs) added to service worker glob patterns for offline caching
- Bumped one-time cleanup version to 1.6.3 to trigger ghost database deletion on all devices

---

## [1.6.2] - 2026-03-09

### Fixed

- Resolved book upload failing with a 500 error on the first attempt by sending a fresh, unconsumed File object to the backend

---

## [1.6.1] - 2026-03-09

### Fixed

- Restored correct functional bookmark behavior and connected state to database
- Fixed bookmark, reading progress, and highlight synchronization errors
- Resolved file download and syncing bugs

---

## [1.6.0] - 2026-03-09

### Added

- Implemented global search feature
- Added dedicated note-taking feature tab

### Improved

- Removed redundant favorite and bookmark icons from the reading view

---

## [1.5.1] - 2026-03-08

### Fixed

- Fixed AI Modal chat synchronization and reading data syncing
- Fixed type errors during data pull and sync operations
- Resolved settings menu import errors

---

## [1.5.0] - 2026-03-08

### Added

- Separated AI database interactions into dedicated native chat session UI
- Added unified bookmark and favorite section
- Implemented backend dictionary caching and word storing

### Improved

- Redesigned Apex loading screen with updated imagery
- Implemented more concrete logic for rendering AI conversations

---

## [1.4.0] - 2026-03-08

### Added

- Implemented robust data sync and retrieval system
- Added automatic downloading of books locally after retrieving from backend
- Added "Download Failed" UI state for proper error handling

### Fixed

- Fixed Dexie and Supabase UUID mismatch syncing bug
- Fixed duplicate key errors and backend 500 schema errors
- Fixed AI chats failing to load and user data pull type errors
- Fixed book upload and download bugs

### Infrastructure

- Restructured frontend, removed duplicate files, and cleaned up the source tree
- Updated Gitignore to properly exclude build logs and error files

---

## [1.3.0] - 2026-03-08

### Added

- Implemented core note-taking functionality

---

## [1.2.0] - 2026-03-07

### Added

- Implemented Dark Mode globally across the application
- Added dedicated dark theme for Reading View and AI Modal

### Improved

- Updated AI text color for better readability

---

## [1.1.0] - 2026-03-07

### Added

- Replaced waitlist with live user registration and sign-up form
- Connected application to actual user data (replaced hardcoded data)

### Fixed

- Fixed CORS errors on backend production
- Resolved bugs involving undefined navigation and auth service imports
- Fixed password bugs during registration
- Fixed synchronization between different devices and browsers
- Enforced lowercase email formatting during registration

### Infrastructure

- Added data migration logic to backend and frontend sync routines

---

## [1.0.1] - 2026-03-07

### Fixed

- Fixed deployment failure and installed Axios
- Updated AI endpoint to incorporate auth headers

### Improved

- Added function to close aside navigation bar when settings button is clicked

---

## [1.0.0] - 2026-03-07 (Official Launch)

### Added

- Initial release of Apex
- PDF and EPUB reader
- AI explanations (in-reader and general)
- Dictionary (in-reader and general)
- Highlighting system
- Waitlist system
