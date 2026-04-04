# Remaining Real Tasks

## Task 1. Mobile Performance Optimization
- Reduce heavy blur and glass effects on mobile
- Simplify landing-page rendering cost on smaller screens
- Reduce mobile shadow noise and expensive background layers
- Keep the same product content, but avoid rendering the heaviest decorative treatment on phones

## Task 2. Runtime User Override Adoption
- Add optional user-aware settings reads in runtime services
- Keep project settings as the fallback default
- Start with safe targets only:
  - AI provider keys
  - storage config
  - Stripe package/config if needed later

## Task 3. Auth And Session Hardening
- Verify logout and relogin flow without stale session state
- Tighten cookie/session/domain assumptions where needed
- Add stronger automated coverage around auth handoff edge cases

## Task 4. Billing And Account Polish
- Improve purchase history clarity
- Add clearer status handling around payment success, failure, and pending states
- Add reset/fallback UX for incomplete payment states

## Task 5. Admin Override Management Polish
- Show which settings are inherited from project defaults
- Show which values are overridden at user scope
- Add an easy reset path from user override back to project default
