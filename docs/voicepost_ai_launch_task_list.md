# VoicePost AI Launch Task List

## Immediate Next Work

Recommended order from here:

1. Add preview of the uploaded files, like they can play the recording in show page
2. Finish Task 08: stabilize `WhisperService`
3. Finish Task 10: align outputs with the intended product scope
4. Finish Task 16: add delete support for content requests
5. Finish Task 17: test with real files and add automated coverage
6. Give 3 suggestions based on entered source in popup modal, user selects it and then generates the content
7. Make a prompt for generating ideas, 3 ideas will be given, "Idea hint"
8. Show processing of AI API calls as AI writing like chatgpt response or claude response, with statuses


## Critical

### 1. Finish video transcription pipeline
Make video uploads truly production-ready by extracting audio from video reliably before transcription. Handle unsupported codecs, extraction failures, and invalid files cleanly.
show video preview

### 2. Enforce backend duration validation
Validate the 1-minute limit on the server for audio, video, and recordings. Do not rely only on client-side checks.

### 3. Add usage limits per user
Track how many runs each user has used and block processing when the limit is reached. Show remaining usage clearly in the UI.

### 4. Add rate limiting and abuse protection
Protect upload, create, retry, and regenerate actions so users cannot spam jobs or overload storage and queues.

### 5. Strengthen failed-job handling
Make sure failed jobs always update the content request status correctly, preserve useful error messages, and allow clean retry behavior.

### 6. Verify storage and media access security
Review how uploaded files are stored and accessed. Ensure files are not exposed incorrectly and media URLs are handled safely.

## Important

### 7. Polish the create workflow
Improve the create page so source selection, upload, recording, preview, validation, and submit flow feel clean and easy to use.

### 8. Finalize recording UX
Improve the in-browser audio recording experience, including start/stop behavior, preview, timing feedback, and validation.

### 9. Validate all five content outputs
Review summary, LinkedIn post, X post, Instagram caption, and newsletter to ensure each output consistently matches the expected format and quality.

### 10. Improve partial-success states
Handle cases where transcript succeeds but content generation fails, or only some outputs are generated. Show clear user feedback for incomplete runs.

### 11. Add admin run monitoring
Create an admin view to inspect recent runs, statuses, failures, and users so support and debugging are manageable after launch.

### 12. Add operational analytics
Track usage patterns such as source type usage, completion rate, failure rate, retry rate, and most-used outputs.

## Nice to Have

### 13. Add per-output regeneration
Allow users to regenerate only one output type, such as LinkedIn post or newsletter, instead of regenerating everything.

### 14. Improve dashboard and workspace polish
Refine layout consistency, output presentation, and workflow guidance so the app feels more premium and easier to trust.

### 15. Prepare launch messaging
Align the product copy across landing page, dashboard, and create flow around one clear promise: turning a 1-minute idea into multi-platform content.

## Final Testing

### 16. Run full end-to-end test coverage
Test all supported inputs and workflows:
- text
- audio upload
- recording
- video
- retry transcription
- regenerate content
- bypass mode on and off
- invalid files
- over-limit duration
- failed provider/storage cases

### 17. Run launch-readiness verification
Before going live, verify:
- real provider mode works
- testing bypass is disabled for production
- queues are stable
- usage limits work
- storage works
- all five outputs render correctly
- failed states are recoverable
