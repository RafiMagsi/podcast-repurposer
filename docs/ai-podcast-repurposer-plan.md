# VoicePost AI — V1 Task Tracker

## Goal

Build a short, simple AI product that lets a user:

1. Upload an audio file
2. Transcribe it
3. Generate useful content outputs
4. View, copy, and reuse the results

This tracker reflects the current repository state, not the original intended stack.

---

## - done Task 01: Set up the application foundation

Scope:
- Laravel app setup
- routing
- base layout
- authenticated app shell

Current implementation:
- Laravel backend is in place
- Inertia + React frontend is in place
- light-theme landing page and app workspace are implemented

Key files:
- `routes/web.php`
- `resources/js/Layouts/AuthenticatedLayout.jsx`
- `resources/js/Layouts/GuestLayout.jsx`
- `resources/css/app.css`

---

## - done Task 02: Add authentication and user separation

Scope:
- register
- login
- password reset
- email verification
- keep episode history separated per user

Current implementation:
- auth flows exist
- profile management exists
- episode access is scoped to the authenticated user

Key files:
- `routes/auth.php`
- `app/Http/Controllers/Auth/*`
- `resources/js/Pages/Auth/*`
- `app/Http/Controllers/ProfileController.php`

---

## - done Task 03: Create the core database models and schema

Scope:
- users
- episodes
- generated contents
- settings

Current implementation:
- `Episode` model exists
- `GeneratedContent` model exists
- user-to-episode relationship exists
- settings storage exists for API and storage credentials

Key files:
- `app/Models/User.php`
- `app/Models/Episode.php`
- `app/Models/GeneratedContent.php`
- `app/Services/SettingService.php`

---

## - done Task 04: Build dashboard and recording history views

Scope:
- dashboard list
- status badges
- previous jobs/results listing

Current implementation:
- dashboard exists
- recordings index/history page exists
- status values are shown in UI

Key files:
- `app/Http/Controllers/DashboardController.php`
- `app/Http/Controllers/EpisodeController.php`
- `resources/js/Pages/Dashboard.jsx`
- `resources/js/Pages/Episodes/Index.jsx`

---

## - done Task 05: Build the upload flow

Scope:
- title input
- tone selector
- audio upload
- validation

Current implementation:
- upload page exists
- title, tone, and audio fields exist
- accepted mime types and file size validation exist

Key files:
- `app/Http/Controllers/EpisodeController.php`
- `resources/js/Pages/Episodes/Create.jsx`

---

## - done Task 06: Store uploaded audio in object storage

Scope:
- S3-compatible storage
- per-episode file path persistence

Current implementation:
- S3 disk factory exists
- uploaded audio is stored through the storage factory
- file metadata is saved on the episode

Key files:
- `app/Services/S3DiskFactory.php`
- `app/Http/Controllers/EpisodeController.php`

---

## - done Task 07: Add queue-based processing flow

Scope:
- avoid long-running work inside the request cycle
- dispatch transcription job
- dispatch content generation job
- update episode statuses

Current implementation:
- queue jobs exist
- upload dispatches transcription
- transcription dispatches generation
- statuses include `uploaded`, `transcribing`, `transcribed`, `generating`, `completed`, `failed`

Key files:
- `app/Jobs/TranscribeEpisode.php`
- `app/Jobs/GenerateEpisodeContent.php`
- `app/Http/Controllers/EpisodeController.php`

---

## Task 08: Stabilize the Whisper transcription pipeline

Original intent:
- send uploaded audio to Whisper
- save transcript
- move episode to `transcribed`

Current state:
- `WhisperService` exists
- audio compression exists
- transcription job exists
- this still needs cleanup before it can be treated as finished reliably

Why this is not marked done:
- `WhisperService` currently contains a `dd(...)` debug stop
- there is still cleanup needed around real-file execution reliability

Key files:
- `app/Services/WhisperService.php`
- `app/Services/AudioCompressionService.php`
- `app/Jobs/TranscribeEpisode.php`

---

## - done Task 09: Add AI content generation service

Current implementation:
- content generation job exists
- generation currently uses OpenAI, not Claude
- outputs currently saved are:
  - summary
  - linkedin_post
  - x_post

Important note:
- this differs from the original plan
- the current repo does not use Claude for generation in the active job path

Key files:
- `app/Services/OpenAIContentService.php`
- `app/Jobs/GenerateEpisodeContent.php`

---

## Task 10: Restore the full original output scope

Original intended outputs:
- summary
- blog post
- LinkedIn post
- X thread

Current implementation:
- summary is implemented
- LinkedIn post is implemented
- X post is implemented

Still missing from the original plan:
- blog post output
- X thread naming/shape from the original doc

Notes:
- the current generator prompt still mentions fields that are not fully aligned with what is actually saved

---

## - done Task 11: Build the result page

Scope:
- transcript display
- summary display
- generated outputs display
- copy actions
- status messaging

Current implementation:
- result page exists
- transcript section exists
- summary section exists
- generated content sections exist
- copy buttons exist
- retry/regenerate actions exist

Key files:
- `resources/js/Pages/Episodes/Show.jsx`
- `app/Http/Controllers/EpisodeController.php`

---

## - done Task 12: Add retry and regenerate actions

Scope:
- retry transcription
- regenerate outputs from transcript

Current implementation:
- retry transcription endpoint exists
- regenerate content endpoint exists
- related UI buttons exist

Key files:
- `app/Http/Controllers/EpisodeController.php`
- `resources/js/Pages/Episodes/Show.jsx`

---

## - done Task 13: Add tone options

Scope:
- professional
- engaging
- concise

Current implementation:
- tone selector exists
- tone is stored on the episode
- generation uses the tone value

Key files:
- `app/Http/Controllers/EpisodeController.php`
- `app/Services/OpenAIContentService.php`
- `resources/js/Pages/Episodes/Create.jsx`

---

## - done Task 14: Add settings management for API keys and storage config

Scope:
- OpenAI key
- generation key
- S3 credentials
- region/bucket/endpoint settings

Current implementation:
- settings page exists
- encrypted setting storage exists
- app reads settings from the database-backed service

Key files:
- `app/Http/Controllers/SettingsController.php`
- `app/Services/SettingService.php`
- `resources/js/Pages/Settings/Index.jsx`

---

## - done Task 15: Apply a polished UI/UX pass across the app

Scope:
- landing page
- dashboard
- recordings
- result page
- settings
- auth
- profile

Current implementation:
- redesigned light-theme UI is in place
- landing page is updated
- app shell/sidebar/topbar are updated
- core product pages are updated

Key files:
- `resources/css/app.css`
- `resources/js/Pages/Welcome.jsx`
- `resources/js/Layouts/AuthenticatedLayout.jsx`
- `resources/js/Layouts/GuestLayout.jsx`

---

## Task 16: Add episode delete support

Original enhancement:
- basic delete action for episodes

Current state:
- not implemented yet

Needed:
- delete endpoint
- authorization
- UI action
- confirmation flow

---

## Task 17: Add automated verification and real-file testing

Scope:
- test uploads with real audio files
- verify queue flow end to end
- verify retry/regenerate behavior
- add automated tests where practical

Current state:
- still pending

Notes:
- this should happen after the Whisper pipeline cleanup

---

## Task 18: Clean up outdated plan assumptions

The old plan no longer matches the app in a few places.

Update these assumptions everywhere if the project keeps evolving:
- frontend stack is `Inertia + React`, not Blade
- active generation path is `OpenAIContentService`, not Claude
- current saved outputs are `summary`, `linkedin_post`, and `x_post`
- the app includes a settings page and profile management beyond the earliest draft

---

## Out of Scope for V1

Do not prioritize these yet:
- Stripe billing
- subscriptions
- plan limits
- multi-team accounts
- advanced admin panel
- mobile app first
- Instagram/TikTok/YouTube/newsletter outputs
- complex workflow automation
- advanced analytics
- white-label settings
- marketplace packaging
- multi-language support
- speaker diarization
- collaborative workspaces

---

## V1 Completion Definition

V1 should be treated as complete when all of these are true:

1. A user can sign in
2. A user can upload an audio file
3. The transcription pipeline runs reliably without debug stops
4. The generation pipeline creates the intended outputs reliably
5. The user can open past recordings
6. The user can copy the generated content
7. Retry and regenerate flows work cleanly

---

## Immediate Next Work

Recommended order from here:

1. Finish Task 08: stabilize `WhisperService`
2. Finish Task 10: align outputs with the intended product scope
3. Finish Task 16: add delete support for episodes
4. Finish Task 17: test with real files and add automated coverage
