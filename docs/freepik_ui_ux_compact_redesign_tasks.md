# Freepik-Style Compact UI/UX Redesign Tasks

## Goal
Transform the current VoicePost AI interface toward a more compact, Freepik-inspired workspace style while keeping the current VoicePost color palette and product flow.

## Core Design Direction
- Use a narrower, denser app shell.
- Keep white and off-white surfaces with dark text.
- Use pale blue and lavender accents sparingly.
- Reduce vertical waste across dashboard, create, and workspace pages.
- Make the UI feel more like a tool workspace and less like stacked marketing cards.

## Product Promise To Preserve
Turn one short source into ready-to-post content.

## Phase 1: Shared Shell And Design System

### 1. Rebuild the app shell - done
- Narrow the left sidebar.
- Reduce topbar height.
- Add one compact search and utility area in the header.
- Standardize page gutters and max widths.
- Improve sidebar collapse behavior for tablet and mobile.

### 2. Build a compact component system - done
- Add compact spacing tokens in CSS.
- Create compact card variants.
- Standardize compact tabs, pills, badges, and icon containers.
- Standardize button heights and spacing.
- Reduce shadow noise and border inconsistency.

### 3. Create shared compact utility classes - done
- Add note-card utility blocks for small informational panels.
- Add compact stat-card spacing rules.
- Add compact responsive grid helpers.
- Add consistent section header spacing rules.
- Reduce the boarder radius of all cards in the design

## Phase 2: Dashboard Redesign

### 4. Turn dashboard into a workspace home - done
- Reduce hero height and remove oversized spacing.
- Keep one top row for quick context and actions.
- Show recent runs, current focus, and usage in a tighter layout.
- Move low-priority tips into smaller side cards.

### 5. Compact the dashboard cards - done
- Tighten spacing in stats cards.
- Tighten spacing in recent recordings.
- Make recurring outputs more asset-like and less verbose.
- Make the current focus card denser and clearer.
- Make the new-run entry card more action-oriented.

### 6. Improve dashboard responsive behavior - done
- Tablet: collapse long side sections lower in the page.
- Mobile: stack cards without oversized gaps.
- Ensure CTA buttons stay aligned and readable on smaller widths.

## Phase 3: Create Workflow Redesign

### 7. Shift create page into tool-panel layout - done
- Use a compact left-side creation panel.
- Use a right-side support panel for outputs and workflow guidance.
- Reduce vertical scroll before submit.
- Make the source type selector denser and clearer.

### 8. Refine source selection and input panels - done
- Make source type cards smaller and more uniform.
- Keep upload, record, and text entry sections visually consistent.
- Reduce long helper paragraphs into smaller support blocks.
- Keep error and progress states compact.

### 9. Tighten create flow responsive layout - done
- Tablet: stack left panel above right support panel cleanly.
- Mobile: keep source selector usable without oversized cards.
- Avoid large empty zones after file selection or recording preview.

## Phase 4: Workspace Redesign

### 10. Rebuild show page into a clearer workspace - done
- Use a narrower details rail and a stronger main content canvas.
- Reduce header clutter.
- Keep one top status strip for run state, transcript, and outputs.
- Make transcript and content review easier to scan.

### 11. Improve workspace card consistency - done
- Match source preview, transcript, summary, and content cards.
- Standardize spacing, title rhythm, and action placement.
- Reduce visual noise from repeated borders and oversized padding.
- Keep quick actions compact and secondary.

### 12. Improve generated content card UX - done
- Make content cards feel like reusable assets.
- Keep actions in consistent positions.
- Reduce visual weight of helper text.
- Keep regeneration/loading/error states compact.

### 13. Improve workspace responsiveness - done
- Tablet: preserve hierarchy without squeezing the main content area.
- Mobile: stack details, preview, transcript, and outputs cleanly.
- Prevent video/audio preview sections from becoming too tall. 
- Make sure both audio and video have enough space for preview

## Phase 5: Secondary Product Screens

### 14. Align library, pipeline, and admin pages - done
- Use the same compact shell and card language.
- Make filters smaller and more consistent.
- Tighten table and list spacing.
- Keep monitoring and queue states easy to scan.

### 15. Align auth pages with the same product message - done
- Keep the same compact visual language.
- Remove outdated output references.
- Keep signup and login focused on the real current product.

### 16. Update landing page to match the new product UI - done
- Reduce oversized hero spacing.
- Show a product-workspace feel instead of generic marketing layout.
- Align copy with current supported inputs and outputs.
- Keep the page clean, compact, and easy to scan.

## Implementation Order

### Pass 1 - done
- Update shared CSS tokens and compact component classes.
- Rebuild authenticated shell and header.
- Make uniform Cards overall the project, make card component and reuse
- Reduce border radius similar to FreePicks design

### Pass 2 - done
- Redesign dashboard.
- Redesign create page and source entry panels.
- Make whole project design compact
- Match text sizes on different screens and keep consistent

### Pass 3 - done
- Redesign workspace show page.
- Align generated content cards and preview panels.
- Make compact UI/UX

### Pass 4 - done
- Align library, pipeline, admin, and auth pages.
- Make similar UI/UX all over the pages
- Refresh landing page.

## Files Most Likely To Change
- `resources/css/app.css`
- `resources/js/Layouts/AuthenticatedLayout.jsx`
- `resources/js/Layouts/GuestLayout.jsx`
- `resources/js/Pages/Dashboard.jsx`
- `resources/js/Pages/ContentRequests/Create.jsx`
- `resources/js/Pages/ContentRequests/Show.jsx`
- `resources/js/Pages/Welcome.jsx`
- `resources/js/Components/create-content/CreateContent.jsx`
- `resources/js/Components/content-responses/ContentPreviewCard.jsx`
- `resources/js/Components/content-responses/ContentResponseCard.jsx`
- `resources/js/Components/ProcessingStatusCard.jsx`
- `resources/js/Components/dashboard/CurrentFocusCard.jsx`
- `resources/js/Components/dashboard/RecentRecordingsCard.jsx`
- `resources/js/Components/dashboard/RecordingInfoCard.jsx`
- `resources/js/Components/dashboard/RecurringOutputsCard.jsx`
- `resources/js/Components/dashboard/StatsCard.jsx`

## Guardrails
- Do not change the product logic while redesigning.
- Do not introduce new source types.
- Keep current VoicePost colors and brand identity.
- Prefer compact clarity over decorative complexity.
- Make responsive behavior part of every redesign pass, not a cleanup task at the end.
