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

# VoicePost AI Launch Task List

## Immediate Next Work

### 1. Add media preview in show page - done
- Show audio player for uploaded audio and recordings.
- Show video player for uploaded video.
- Show source text block for text input.
- Confirm preview works for S3/local URLs.
- Add Voice and Video recording option with preview
- Make page for pipeline that shows current going on active processings

### 2. Stabilize `WhisperService` - done
- Review current transcription flow for audio, video, and recording.
- Confirm temporary files are created and cleaned correctly.
- Add clear logs for each stage of transcription.
- Handle extraction/compression/transcription failures cleanly.

### 3. Align outputs with product scope - done
- Keep only the intended output set in prompts and UI.
- Verify labels, ordering, and descriptions match the product.
- Remove old unused output references from code and views.
- Confirm all outputs render correctly in the workspace.

### 4. Add delete support for content requests - done
- Add backend delete action with ownership check.
- Delete generated content records with the episode.
- Delete uploaded media from storage if present.
- Add confirmation modal in index and show pages.

### 5. Test with real files and add automated coverage - done
- Test real text, audio, recording, and video inputs.
- Add feature tests for create, show, retry, and regenerate.
- Add failure-case tests for invalid files and provider errors.
- Verify live status polling works during processing.

### 6. Add 3 suggestions from entered source
- Create backend prompt/service for suggestion generation.
- Show suggestions in a modal before final generation.
- Let user select one suggestion to continue.
- Store or pass the selected suggestion into generation.

### 7. Add “Idea hint” flow
- Create a prompt that returns 3 idea hints.
- Add a small UI entry point near text/source input.
- Show hints in a compact modal or panel.
- Let user insert a selected hint into the source field.

### 8. Show AI writing-style progress states
- Add progressive processing messages per stage.
- Show AI-style writing/status animation in workspace.
- Map each backend status to a clear UI message.
- Stop animation automatically when processing is complete.

## Critical

### 1. Finish video transcription pipeline
- Extract audio from uploaded video before transcription.
- Reject unsupported codecs and invalid video files.
- Add clear error messages for extraction failure.
- Show video preview in the workspace.

### 2. Enforce backend duration validation
- Validate duration on the server for audio inputs.
- Validate duration on the server for video inputs.
- Validate duration on the server for recordings.
- Return clear validation errors for over-limit media.

### 3. Add usage limits per user
- Track processed runs per user.
- Add backend limit checks before job dispatch.
- Show remaining usage in dashboard and create flow.
- Block new processing when the limit is reached.

### 4. Add rate limiting and abuse protection
- Rate-limit create/upload actions.
- Rate-limit retry and regenerate actions.
- Prevent repeated spam submissions from the same user.
- Add safe fallback error messages for blocked requests.

### 5. Strengthen failed-job handling
- Ensure failed jobs always update episode status.
- Save a useful error message on failure.
- Distinguish transcription failure from generation failure.
- Confirm retry paths reset only the required fields.

### 6. Verify storage and media access security
- Review whether media files should be public or signed.
- Validate media URLs before rendering players.
- Confirm settings and secrets stay server-side only.
- Check delete flow removes unused media safely.

## Important

### 7. Polish the create workflow
- Clean up source type selection layout.
- Improve upload and text entry clarity.
- Improve validation and inline error messages.
- Improve submit success/redirect behavior.

### 8. Finalize recording UX
- Improve record start/stop controls.
- Show recording state clearly while recording.
- Show preview and duration after recording stops.
- Handle permission denial gracefully.

### 9. Validate all five content outputs
- Verify summary format is concise and consistent.
- Verify LinkedIn post format matches product tone.
- Verify X post stays under the required limit.
- Verify Instagram caption includes body and 5 hashtags.
- Verify newsletter includes subject and email-ready body.

### 10. Improve partial-success states
- Handle transcript success with generation failure.
- Handle generation success with missing output types.
- Show partial completion status clearly in UI.
- Add clear retry actions for incomplete runs.

### 11. Add admin run monitoring
- Create a basic admin run list page.
- Show user, source type, status, and created time.
- Add filters for failed and processing runs.
- Add quick links to inspect a run.

### 12. Add operational analytics
- Track source type usage.
- Track completion and failure rates.
- Track retry and regenerate usage.
- Track most-used output types.

## Nice to Have

### 13. Add per-output regeneration
- Add backend action for single-output regeneration.
- Add UI actions on each generated content card.
- Preserve other outputs when one output is regenerated.
- Show loading state for per-output regeneration.

### 14. Improve dashboard and workspace polish
- Improve spacing and alignment across cards.
- Improve source/output card consistency.
- Improve mobile and tablet layout behavior.
- Refine informative panels without adding clutter.

### 15. Prepare launch messaging
- Define one product promise and use it everywhere.
- Update landing page copy to match current scope.
- Update dashboard and create page copy to match.
- Remove old wording that no longer fits the product.

## Final Testing

### 16. Run full end-to-end test coverage
- Test text input flow.
- Test audio upload flow.
- Test recording flow.
- Test video flow.
- Test retry and regenerate flows.
- Test bypass mode on and off.
- Test invalid files and over-limit duration.
- Test provider and storage failure cases.

### 17. Run launch-readiness verification
- Verify real provider mode works correctly.
- Verify testing bypass is disabled for production.
- Verify queue workers and jobs remain stable.
- Verify usage limits and rate limits work.
- Verify storage and media playback work.
- Verify all five outputs render correctly.
- Verify failed states are recoverable.