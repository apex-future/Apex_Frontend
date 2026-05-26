# Changelog

All notable changes to Apex are documented here.
This project follows [Semantic Versioning](https://semver.org/).


## [1.9.2] - 2026-05-26
### Fixed
- App entry is immediate for authenticated users — renders from local Dexie data without waiting on network
- Removed `hydrating` loading gate; token verification and cloud sync run in the background after render
- Post-login sync is non-blocking (`.then().catch()` instead of `await`)

---

## [1.9.1] - 2026-04-22
### Fixed
- index.html no longer cached at Vercel CDN edge — users see new deploys immediately
- Service Worker now uses NetworkFirst for HTML navigation — eliminates stale app shell on reload
- /assets/* set to immutable cache — performance improvement for returning users

---

## [1.9.0] - 2026-04-19
### Improved
- Optimized ReaderView performance by migrating selection state to refs
- Fixed catastrophic re-render loops in PDFReader virtualizer
- Stabilized customTextRenderer and highlight effects dependency arrays
- Removed redundant window resize listeners in favor of ResizeObserver

---

## [1.8.4] - 2026-04-10
### Security
- JWT payload now whitelisted — password_hash and full user row removed from token
- JWT sub field changed from email to UUID for stability and security
- get_current_user now looks up by UUID instead of email
- Backward compatible — old email-based tokens still work until they expire

---

## [1.8.3] - 2026-04-02
### Fixed
- App no longer shows infinite loading screen on mobile when sync crashes
- Moved `setHydrating(false)` into `finally` blocks in both `checkAuth` and `handleLogin`
- Sync errors are still logged to console — local data loads correctly regardless of sync outcome

---

## [1.8.2] - 2026-03-28
### Fixed
- Streak sync is now clock-agnostic — server validates all dates before saving
- Devices with wrong clocks can no longer corrupt streak data in Supabase
- Future dates in streak_history are sanitized before saving to Supabase
- Client store self-corrects if server rejects or adjusts its date
- 1-day tolerance applied for legitimate timezone differences

---

## [1.8.1] - 2026-03-28
### Fixed
- Sync algorithm is now completely immune to device clock skew
- Replaced client-clock-based timestamp comparison with server-anchor approach
- last_synced_at is now always server-generated — client clock never participates in sync decisions
- Devices with wrong clocks can no longer corrupt Supabase data by pushing stale local state
- Streak data is now safe from clock-skewed devices overwriting cloud records
- Push happens before pull when both are needed — local changes preserved before cloud overwrites

### Changed
- _getLocalTableTimestamp and _setLocalTableTimestamp removed — sync queue used for local change detection instead
- _compareTimestamps removed — replaced by _tableNeedsSync using server anchor
- GET /api/sync/timestamps now returns server_time field alongside table timestamps

---

## [1.8.0] - 2026-03-28
### Changed
- Sync architecture upgraded to per-table timestamp conflict resolution
- pullAllUserData now compares local vs cloud timestamps before syncing each table
- Tables only sync when there's an actual difference — equal tables are skipped entirely
- Local-newer tables skip pull and let pushSync handle the upload direction
- Eliminates the "cloud always wins" problem — offline changes are now preserved correctly
- O(1) comparison per table instead of blind clear + bulkAdd on every app load

### Added
- New GET /api/sync/timestamps endpoint — returns max(updated_at) per table
- last_modified field added to all Category A Dexie tables (books, reading_progress, highlights, bookmarks, notes)
- Per-table local timestamps stored in app_settings (table_modified_{tableName})
- 5-second clock tolerance in timestamp comparison to handle device clock drift
- Streak breaking now works correctly across devices — local wins when local is newer

---

## [1.7.5] - 2026-03-27

### Added

- Support for multiple file selection during upload in both Top and Bottom navigation bars
- Automated welcome emails containing app instructions and WhatsApp community links are now sent to users upon successful sign-up

### Improved

- Replaced timed lazy-loading with true virtualization in vertical PDF reader
  using @tanstack/react-virtual — only visible pages (±2 overscan) are
  mounted at any time, eliminating hangs on large documents
- Fixed horizontal reader blinking on every page turn — adjacent pages are
  now pre-rendered in a buffer so swipes are instant with no skeleton flash
- Added 150ms crossfade transition to horizontal page turns for smooth,
  native-feeling navigation
- Extracted and centralized email sending logic in backend utilities for better maintainability

### Fixed

- Resolved issue where dismissing Dictionary or Add Note sub-modals in `HighlightMenu` wouldn't clear the active text selection or close the entire menu. Added `onClose` callback to handle menu termination.
- Improved `onDictToggle` logic in `HighlightMenu` to prevent unexpected state falls back.

---

## [Unreleased]

### Added

### Improved

---

## [1.7.4] - 2026-03-25

### Fixed

- Fixed reader flickering, blank pages, and accidental navigation when selecting text in the PDF reader by preventing virtualizer recalculation and swipe navigation during active selection

---

## [1.7.3] - 2026-03-25

### Added

- Settings system — all toggles now functional and persisted
- New settingsStore (Zustand) backing all user preferences
- Settings synced to Supabase user_settings table
- Settings seeded from Supabase on login across all devices
- Page Animation toggle with Smooth Slide and Fade Through options
- Scroll direction setting available in both in-reader and main Settings page
- Auto-Explain Highlights — AI opens automatically on text selection when enabled
- autoSaveProgress — when off, skips Supabase sync for progress (still saves locally)
- saveChatHistory — when off, AI conversations not persisted
- PATCH /api/settings endpoint with upsert behavior
- Settings sync automatically when device comes back online

---


## [1.7.2] - 2026-03-24

### Added

- Streak system — 1-minute reading timer triggers daily streak
- Full streak history stored locally (Zustand persist) and synced to Supabase
- Streak page (/streak) with monthly calendar showing active days
- Calendar shows today in black, streak days in orange, missed days empty
- Motivational subtitle changes based on streak count
- StreakBadge always visible in TopNavBar — navigates to /streak
- PATCH /api/auth/streak endpoint
- Streak seeded from Supabase on login — respects offline-first priority
- Streak syncs automatically when device comes back online

### Fixed

- Removed incorrect streak trigger on app mount — streak now only counts after 1 minute of reading

---

## [1.7.1] - 2026-03-20
### Added
- Notes now synced to Supabase with full offline support
- New `notes` Dexie table (version 7) — notes no longer stored in book metadata only
- New `notes` Supabase table with note_type (manual_note / highlight_note)
- Notes pulled on login and app load via pull/all sync
- New backend endpoints: POST /api/books/{id}/notes, PUT /api/notes/{id}, DELETE /api/notes/{id}
- Offline notes queued and synced when back online

---

## [1.7.0] - 2026-03-20
### Fixed
- Offline book uploads now correctly upload file to Supabase Storage when back online
- Books uploaded offline no longer appear with null file_path after sync
- Generic sync queue now explicitly excludes book items — books only go through uploadBook()
- Added detailed console logging for offline book upload sync flow

---

## [1.6.9] - 2026-03-17
### Improved
- Book appears in library immediately when uploaded (optimistic UI)
- Persistent "Uploading your book..." toast shows during upload
- Toast updates to success or warning when upload resolves
- Book card shows uploading spinner overlay while upload is in progress

---

## [1.6.8] - 2026-03-17
### Fixed
- Book delete now uses in-memory book object as fallback when Dexie record has shifted ID after pull sync
- Supabase delete queue now fires correctly even when Dexie lookup returns null
- Book delete also searches by supabaseId to catch mismatched Dexie integer IDs

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
