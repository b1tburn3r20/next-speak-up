# Acceptance criteria

Work isn't done until each line is proven by a test or by looking at it. `[ ]` means not yet proven. Update this as things are proven. Tests are in `tests/e2e/mission.spec.ts`, `tests/unit/mission-logic.test.ts`, `tests/unit/store-rendering.test.tsx`, and the pipeline's `tests/test_member_data.py`.

## Foundations

- [x] Reference sheets exist and `CLAUDE.md` points to them
- [x] One theme only: no picker, no `dark:` classes, no leftover theme CSS
- [x] Blocks exist (`PageShell`, `PageHeader`, `Section`, `OuterBlock`, `InnerBlock`, `Stack`, `Flex`, `Grid`), and every main page uses them
- [x] Older `components/cb` blocks use the same styling, without slow entrance animations
- [x] Zustand holds votes, follows, progress, and saved members
- [x] Voting on one bill doesn't re-render another bill's buttons (test)

## Representation alignment

- [x] A rep's vote is not in the HTML of a bill, pulse, or session before the user votes (test)
- [x] After voting, the reveal shows the rep's picture, position, and whether they match (test)
- [x] "Show me anyway" works without voting (test)
- [x] The dashboard has pulse checks: "your rep just voted, you vote too" (test)
- [x] Each rep has an alignment verdict in words, and asks for more votes under 3 (test)
- [x] Each rep shows job measures compared with their chamber (test)
- [x] Alignment by policy area is shown, including where you differ most

## Dashboard

- [x] Tailored: reps with pictures, recaps of what they've done, pulse, progress, next step
- [x] Signed out: explains the idea and offers a clear first action
- [x] No location: the first step is to find your reps
- [x] No recent votes in Congress: says so, instead of showing zeros

## Always something to do

- [x] A one-at-a-time voting session at `/vote`, with progress and a finish screen
- [x] Next steps change with what the user has done (test)
- [x] Every main page has a next step (test)
- [x] Streak, level, daily goal, and badges come from real activity (test)

## Demystifying

- [x] Upcoming bills show policy area, sponsor picture, cosponsor count, and a digest
- [x] Bill page: the digest is at the top, large, without CRS boilerplate
- [x] Every sponsor and cosponsor is listed, with pictures
- [x] Policy areas are color coded, with explanations, on their own pages (`/topics`)
- [x] Jargon explains itself on tap, and there's a glossary (`/learn`)
- [x] Timeline actions have plain explanations

## Charts

- [x] Member pages chart sponsored bills by policy area, using the full record
- [x] Member pages chart voting by policy area
- [x] Senators and representatives both get them
- [x] Charts have text alternatives, and validated colors

## Data

- [x] `voted_bills` loads every bill that has a roll call
- [x] `member_legislation` loads complete sponsorship records
- [x] `member_stat` and `member_policy_stat` are filled by the pipeline, and pages read them
- [x] `roll_call.isFinalVote` is stored and indexed, and Python and TypeScript agree (test)
- [x] `senate_gap` check runs daily
- [x] Every gap in the data guidelines is handled (test or look)
- [x] Speed targets met on a production build (measured)

## Quality

- [x] `tsc`, ESLint, unit tests, pipeline tests, and browser tests all pass
- [x] Production build passes
- [x] No sideways scrolling at 360, 390, 768, or 1280px on any main page (test)
- [x] No browser console errors on main pages (test)
- [x] Each main page reviewed by screenshot on phone and desktop, against the UI test questions
- [x] Paid services are never called in tests
