# Acceptance criteria

Work isn't done until each line is proven by a test or by looking at it. `[ ]` means not yet proven. Update this as things are proven, and note how.

## Foundations

- [ ] Reference sheets exist and `CLAUDE.md` points to them
- [ ] One theme only: no picker, no `dark:` classes, no leftover theme CSS
- [ ] Blocks exist (`PageShell`, `PageHeader`, `Section`, `OuterBlock`, `InnerBlock`, `Stack`, `Flex`, `Grid`), and every main page uses them
- [ ] Older `components/cb` blocks use the same styling, without slow entrance animations
- [ ] Zustand holds votes, follows, progress, and saved members
- [ ] Voting on one bill doesn't re-render another bill's buttons (test)

## Representation alignment

- [ ] A rep's vote is not in the HTML of a bill, pulse, or session before the user votes (test)
- [ ] After voting, the reveal shows the rep's picture, position, and whether they match (test)
- [ ] "Show me anyway" works without voting (test)
- [ ] The dashboard has pulse checks: "your rep just voted, you vote too" (test)
- [ ] Each rep has an alignment verdict in words, and asks for more votes under 3 (test)
- [ ] Each rep shows job measures compared with their chamber (test)
- [ ] Alignment by policy area is shown, including where you differ most

## Dashboard

- [ ] Tailored: reps with pictures, recaps of what they've done, pulse, progress, next step
- [ ] Signed out: explains the idea and offers a clear first action
- [ ] No location: the first step is to find your reps
- [ ] No recent votes in Congress: says so, instead of showing zeros

## Always something to do

- [ ] A one-at-a-time voting session at `/vote`, with progress and a finish screen
- [ ] Next steps change with what the user has done (test)
- [ ] Every main page has a next step (test)
- [ ] Streak, level, daily goal, and badges come from real activity (test)

## Demystifying

- [ ] Upcoming bills show policy area, sponsor picture, cosponsor count, and a digest
- [ ] Bill page: the digest is at the top, large, without CRS boilerplate
- [ ] Every sponsor and cosponsor is listed, with pictures
- [ ] Policy areas are color coded, with explanations, on their own pages (`/topics`)
- [ ] Jargon explains itself on tap, and there's a glossary (`/learn`)
- [ ] Timeline actions have plain explanations

## Charts

- [ ] Member pages chart sponsored bills by policy area, using the full record
- [ ] Member pages chart voting by policy area
- [ ] Senators and representatives both get them
- [ ] Charts have text alternatives, and validated colors

## Data

- [ ] `voted_bills` loads every bill that has a roll call
- [ ] `member_legislation` loads complete sponsorship records
- [ ] `member_stat` and `member_policy_stat` are filled by the pipeline, and pages read them
- [ ] `roll_call.isFinalVote` is stored and indexed, and Python and TypeScript agree (test)
- [ ] `senate_gap` check runs daily
- [ ] Every gap in the data guidelines is handled (test or look)
- [ ] Speed targets met on a production build (measured)

## Quality

- [ ] `tsc`, ESLint, unit tests, pipeline tests, and browser tests all pass
- [ ] Production build passes
- [ ] No sideways scrolling at 360, 390, 768, or 1280px on any main page (test)
- [ ] No browser console errors on main pages (test)
- [ ] Each main page reviewed by screenshot on phone and desktop, against the UI test questions
- [ ] Paid services are never called in tests
