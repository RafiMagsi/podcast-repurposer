# AI Podcast-to-Content Repurposer — Lean General-Use Product Plan

## Product Goal

Build a short, simple, general-use AI product that lets a user:

1. Upload an audio file
2. Transcribe it
3. Generate a few useful content outputs
4. View, copy, and reuse the results

This version is **not** for selling yet.  
This version is for:
- building a clean working product fast
- proving the workflow
- creating a strong portfolio/demo asset
- preparing a base that can later be extended for mobile, web, or marketplace sale

---

## Core Product Positioning

A simple AI tool that turns podcast or spoken audio into ready-to-use written content.

### Core user flow
Upload audio → transcribe audio → generate content → review output → copy/export text

---

## Product Scope

## What this version should include

### Essential features
- User authentication
- Audio upload
- Audio storage
- Transcription using Whisper API
- Content generation using Claude API
- Result page showing:
  - transcript
  - summary
  - blog post
  - LinkedIn post
  - X thread
- History page for previous episodes
- Processing status
- Copy-to-clipboard actions

### Optional but small enhancements
- Regenerate outputs
- Output tone selector
- Transcript summary block
- Basic delete action for episodes

---

## What this version should NOT include

Do not add these now:
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
- editing studio
- collaborative workspaces

Reason: all of that slows down shipping and weakens focus.

---

## Recommended Stack

## Backend
- Laravel 11
- Laravel queues
- MySQL
- Laravel storage
- HTTP client for API calls

## Frontend
For the short and simple version, use:
- Laravel Blade
- Tailwind CSS
- Alpine.js only if needed

Reason:
- fastest to build
- fewer moving parts
- simpler auth
- simpler deployment
- easier to debug

Later, this can be converted into:
- Flutter mobile app
- Flutter web frontend
- API-first product

---

## AI Services

## Transcription
- OpenAI Whisper API

## Content generation
- Claude API

---

## V1 Outputs

Keep only these 3 outputs:

1. Blog post
2. LinkedIn post
3. X thread

Also include:
- transcript
- short summary

Reason:
These are enough to show strong value without bloating the product.

---

## Product Pages

## 1. Login / Register
Purpose:
- basic authentication
- keep user history separated

## 2. Dashboard
Purpose:
- list uploaded episodes
- show status:
  - uploaded
  - transcribing
  - generating
  - completed
  - failed

## 3. Upload Page
Purpose:
- upload audio file
- set title
- optionally choose tone/style

## 4. Result Page
Purpose:
- show transcript
- show summary
- show blog post
- show LinkedIn post
- show X thread
- allow copy/regenerate

## 5. History Page
Purpose:
- view previous jobs/results

---

## Suggested Database Design

## users
Default Laravel users table

## episodes
Fields:
- id
- user_id
- title
- original_file_name
- file_path
- mime_type
- file_size
- duration_seconds nullable
- status
- transcript nullable
- summary nullable
- error_message nullable
- created_at
- updated_at

## generated_contents
Fields:
- id
- episode_id
- content_type
- title nullable
- body longText
- meta json nullable
- created_at
- updated_at

### content_type values
- blog_post
- linkedin_post
- x_thread

---

## Suggested Status Flow

Episode status values:
- uploaded
- transcribing
- transcribed
- generating
- completed
- failed

Flow:
1. user uploads audio
2. episode record created with status = uploaded
3. transcription job starts
4. status = transcribing
5. transcript saved
6. status = transcribed
7. generation job starts
8. status = generating
9. outputs saved
10. status = completed

If anything breaks:
- status = failed
- save error_message

---

## Suggested Folder Structure

```text
podcast-repurposer/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── Auth/
│   │       ├── DashboardController.php
│   │       ├── EpisodeController.php
│   │       └── ContentController.php
│   ├── Jobs/
│   │       ├── TranscribeEpisode.php
│   │       └── GenerateEpisodeContent.php
│   ├── Models/
│   │       ├── User.php
│   │       ├── Episode.php
│   │       └── GeneratedContent.php
│   ├── Services/
│   │       ├── WhisperService.php
│   │       ├── ClaudeService.php
│   │       └── EpisodeProcessingService.php
│   └── Enums/
│           └── EpisodeStatus.php
├── database/
│   ├── migrations/
│   └── seeders/
├── resources/
│   ├── views/
│   │   ├── auth/
│   │   ├── dashboard.blade.php
│   │   ├── episodes/
│   │   │   ├── create.blade.php
│   │   │   ├── index.blade.php
│   │   │   └── show.blade.php
│   └── css/
├── routes/
│   └── web.php
└── config/
    └── services.php
```

---

## Functional Workflow

## Step 1 — User uploads audio
Inputs:
- title
- audio file

Accepted file types:
- mp3
- wav
- m4a

System actions:
- validate file
- store file
- create episode row
- dispatch transcription job

## Step 2 — Transcription job runs
System actions:
- send audio to Whisper
- receive transcript text
- save transcript
- update status
- dispatch content generation job

## Step 3 — Content generation runs
System actions:
- send transcript to Claude
- generate:
  - summary
  - blog post
  - LinkedIn post
  - X thread
- save outputs
- mark complete

## Step 4 — User reviews content
User actions:
- read transcript
- copy outputs
- regenerate if needed

---

## Prompt Strategy

Keep prompt strategy simple and reusable.

## Input to Claude
- transcript text
- desired tone
- requested output types

## Output rules
- clean formatting
- no markdown junk unless useful
- professional but readable tone
- preserve main ideas from transcript
- no hallucinated claims

## Separate prompt sections
Use a system-style structure in code:
- role
- output instructions
- content type instructions
- formatting rules
- transcript payload

---

## Example Tone Options

Keep only 3:
- professional
- engaging
- concise

Default tone:
- professional

---

## UI Plan

## Dashboard
Show:
- episode title
- created date
- status badge
- view button

## Upload page
Show:
- title input
- audio upload field
- tone selector
- submit button

## Result page
Sections:
1. Transcript
2. Summary
3. Blog Post
4. LinkedIn Post
5. X Thread

Each content block should have:
- copy button
- regenerate button later if needed

---

## Error Handling Plan

Handle these cleanly:
- invalid file type
- oversized file
- transcription API failure
- content generation API failure
- timeout
- missing API key
- empty transcript
- unsupported audio

User-facing rule:
- show simple error messages
- keep technical logs in backend only

---

## Security and Validation

## Validation
- authenticated users only
- validate upload size
- validate mime types
- ensure users only access their own episodes

## Storage
- keep uploaded files in non-public storage if possible
- only expose download/view if needed later

## API keys
Store in `.env`:
- OPENAI_API_KEY
- CLAUDE_API_KEY

---

## Performance Plan

Keep it simple:
- use queue jobs from day one
- avoid doing transcription/content generation in the request cycle
- show processing state in UI
- allow manual refresh on result page

Later improvements can include:
- polling
- websockets
- notifications

Not now.

---

## Build Phases

## Phase 1 — Foundation
Deliverables:
- Laravel setup
- auth
- DB schema
- models
- routes
- basic Blade layout

## Phase 2 — Upload + Episode Management
Deliverables:
- upload form
- storage logic
- episode records
- dashboard/history listing

## Phase 3 — Whisper Integration
Deliverables:
- WhisperService
- TranscribeEpisode job
- transcript save
- status updates

## Phase 4 — Claude Integration
Deliverables:
- ClaudeService
- GenerateEpisodeContent job
- summary + 3 outputs
- save generated contents

## Phase 5 — Result UI
Deliverables:
- transcript display
- content sections
- copy buttons
- status messages

## Phase 6 — Polish
Deliverables:
- validation cleanup
- failure handling
- UI cleanup
- test with real files
- seed sample data if needed

---

## Recommended Build Order

1. Laravel project setup
2. Auth scaffolding
3. Episodes migration + model
4. Upload page
5. Dashboard list
6. Queue setup
7. Whisper service
8. Transcription job
9. Claude service
10. Generation job
11. Result page
12. Copy buttons
13. Error handling
14. Final cleanup

---

## Suggested Development Timeline

## Fast version
- 3 to 5 days

## Cleaner version
- 5 to 7 days

### Ideal day plan

## Day 1
- setup Laravel
- install auth
- create migrations/models
- build dashboard/upload screens

## Day 2
- implement upload flow
- store audio
- create episode records
- configure queues

## Day 3
- integrate Whisper
- save transcript
- show transcript on result page

## Day 4
- integrate Claude
- generate summary + 3 outputs
- save outputs

## Day 5
- UI cleanup
- error handling
- copy actions
- test with multiple files

## Day 6–7 if needed
- polish
- improve prompts
- refactor service classes
- write README

---

## Success Criteria for V1

The product is done when a user can:
- sign in
- upload an audio file
- wait for processing
- see transcript
- see summary
- see blog post
- see LinkedIn post
- see X thread
- copy the content
- view past uploads

If that works reliably, V1 is complete.

---

## Future Expansion Path

After V1 is stable, next upgrades can be:
- Flutter mobile app
- API-first backend
- more output types
- export to PDF/DOCX
- multi-language support
- subscriptions
- admin analytics
- marketplace packaging

But only after V1 works cleanly.

---

## Ruthless Recommendation

Do not build this like a startup yet.

Build it like this:
- small
- functional
- fast
- clean
- demoable

That is the correct move.

The biggest mistake now would be adding too many outputs, too many roles, too many settings, or too much architecture before the basic workflow is proven.

---

## Final Recommended V1

### Stack
- Laravel 11
- Blade
- Tailwind
- MySQL
- Queue
- Whisper API
- Claude API

### Features
- Auth
- Upload audio
- Transcribe audio
- Generate summary
- Generate 3 content outputs
- History
- Result screen
- Copy actions

### Timeline
- 5 days target
- 7 days comfortable

### Goal
Ship a simple, strong, working AI product.

