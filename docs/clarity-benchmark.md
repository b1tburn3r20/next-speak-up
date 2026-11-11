# Clarity benchmark

**The test:** could a 13-year-old use this page without asking anyone a question? Every page and user story is scored against this sheet, and the work isn't done until each one passes two rounds in a row.

Read this with `docs/mission.md` (why) and `docs/ui-guidelines.md` (how).

## How a page is scored

Look at it on a phone (390 × 844) first, then on a computer. Score each question 1 (yes) or 0 (no).

| # | Question | What a yes looks like |
| --- | --- | --- |
| 1 | **Purpose.** In three seconds, can I say what this page is for? | A plain heading, and one short sentence under it saying why I'd care. |
| 2 | **Mine first.** Is what's about me at the top? | My reps, my state, my city, or my next vote comes before anything general. A page that isn't about me leads with its single most important fact. |
| 3 | **One next step.** Is there one obvious thing to do? | One filled button on the first phone screen. Other actions are quieter: outlined, or links. |
| 4 | **Calm.** Can I take it in without feeling buried? | The first phone screen has at most three blocks. Nothing appears twice. The page is under about four phone screens, unless it's a list I asked for. Extra detail is behind a tab, a "Show more", or another page. |
| 5 | **Plain words.** Do I know every word? | No unexplained jargon. Terms like "cloture", "roll call", "sponsor", or "chamber" are replaced, or tap to explain. |
| 6 | **Signposts.** Do I know where each tap takes me? | Links say where they go ("See all 15 bills"), never just "More". Numbers and badges have a label. |
| 7 | **Honest gaps.** When something's missing, do I know why, and what to do? | Empty states give the reason and a next step. No blank boxes. |
| 8 | **Way on.** When I reach the bottom, is there somewhere to go? | The page ends in a next step, never a dead end. |

**A page passes** with at least 7 of 8, and questions 1 and 3 must both be yes.

## User stories

Each is walked through as a new person on a phone, counting taps from the page named. A story passes when every step is obvious (no guessing which button) and it fits the tap budget.

| # | As a… | I want to… | Start | Taps |
| --- | --- | --- | --- | --- |
| S1 | Visitor | understand what this is, and sign up | Landing page | 2 |
| S2 | New member | see who represents me, with faces | Right after signing up | 3 |
| S3 | Member | vote on something my rep voted on, then find out if we match | Home | 2 |
| S4 | Member | see what Congress may vote on this week, and weigh in | Home | 2 |
| S5 | Member | tell whether my senator represents me, and where we differ | Home | 2 |
| S6 | Anyone | find out what a word means | Any bill | 1 |
| S7 | Iowan | see my state legislators and what's happening at the statehouse | Home | 2 |
| S8 | Iowan | see my city council's next meeting, how to speak, and get a reminder | Home | 2 |
| S9 | Member | get notified about something I care about | Anywhere it's offered | 3 |
| S10 | Member | see my streak, level, and what earns more | Home | 1 |
| S11 | Member | change where I live, or my notifications | Home | 3 |
| S12 | Member | talk about a bill with others | A bill | 2 |
| S13 | Iowan | find my town hall meeting, or my mayor, by searching a plain word | Anywhere | 2 |
| S14 | Member | see what's new for me | Anywhere | 1 |
| S15 | Member | vote on everything Congress may take up this week, and see how far I've got | Home | 2 |
| S16 | Visitor | get back to the front page and see what this is | Anywhere | 1 |
| S17 | Member | check quickly whether one member votes like me | Their page | 1, then a vote per bill |

## What each page is for

Every page has one job, and leads somewhere. If a section on a page doesn't serve its job, it belongs on the page whose job it is.

| Page | Its one job | Leads to |
| --- | --- | --- |
| Home `/dashboard` | My people, and my one next thing to do | A vote, a rep's report card, my state or city |
| Vote `/vote` | Vote on bills, one at a time | The reveal: did my reps match? |
| My Reps `/reps` | Do my reps represent me? | A rep's report card, or bills to vote on |
| Progress `/progress` | How I'm doing, and what earns more | Vote, quests |
| Leaderboard `/leaderboard` | How I compare this week | Vote |
| Upcoming Votes `/federal/upcoming` | What Congress may vote on soon | A bill, to weigh in |
| Bills `/federal/bills` | Find any bill | A bill |
| A bill | What it is, where it stands, and what I think | Vote, follow, the forum |
| Topics `/federal/topics` | Pick what I care about | A topic's bills |
| Legislators `/federal/legislators` | Find any member of Congress | A member |
| A member | What they do, and whether they vote like me | Their votes, their bills |
| States `/states` | Find a state | A state |
| A state | My statehouse: my legislators, its bills, its cities | Its bills, legislators, cities, meetings |
| A city | My City Hall: the next meeting, the mayor, how to speak | A meeting, a reminder, City Hall's phone |
| Learn `/learn` | Words and how government works | A bill |
| Settings `/settings` | How the app works for me | Profile, notifications |
| Forum `/forum` | Talk about bills. Shelved for now (`lib/features.ts`) | A post, or writing one |

## Scores

Scored on a phone, by persona: **new** (just signed up, no location), **outsider** (lives outside a state we cover), **Iowan** (Des Moines, with a ward), and **signed out**. Each round is a full pass over every page. A page's score is its lowest across the personas that can see it.

The rounds are recorded below as they happen.

### Round 0: before (2026-11-10)

Scored before any changes, on a phone. **P** is the page's score out of 8, and the lowest-scoring question is named.

| Page | P | Pass | What failed |
| --- | --- | --- | --- |
| Home | 3 | ✗ | Your reps were seven screens down, under Congress's whole schedule. 18 sections, three bills repeated. "0/3" with no label, "9+" unexplained. 10,379px tall. |
| Vote | 6 | ✗ | No heading, so nothing said what the page is. No reason given for why each bill is there. |
| Upcoming votes | 6 | ✗ | 11,734px: every week's cards plus the Senate, stacked. |
| Des Moines | 6 | ✗ | 7,687px: every section stacked. The only city without the first-screen card. |
| Iowa legislators | 6 | ✗ | 16,162px of cards, with your own two buried in the list. |
| A bill (signed out) | 6 | ✗ | The vote came after a long summary, and the summary appeared twice. |
| Settings | 6 | ✗ | No description. No way to change where you live once it's set. |
| Iowa meetings | 6 | ✗ | Its description talked about subcommittees, over a list of city council meetings. |
| Iowa bills, Leaderboard | 7 | ✓ | Both had a word run into "Iowa" ("Iowadoesn't", "Iowato"), from a dropped space. |
| Progress | 7 | ✓ | Nine locked ranks fill the first screen. |
| A member of Congress | 7 | ✓ | Four long sections stacked. |
| Everything else | 7–8 | ✓ | |

### Round 1: what changed

- **Home** answers the app's question in order: your next vote (one card, voted right there), who represents you (every face from Congress to City Hall, with whether they match you), and one line per government for this week. Congress's schedule, the topic chart, rep work, and the leaderboard went to their own pages. 10,379px → 2,771px.
- **The progress row** says what each number is ("votes today"), and the streak goes to Progress, where it's explained.
- **Vote** has a heading, and each bill says why it's there ("Your reps voted on this", "Congress may vote on this soon", "In a topic you track").
- **Upcoming votes** is a House tab and a Senate tab. Cards keep the topic, sponsor, and what the bill does, with Follow left to the bill's page. 11,734px → about 7,000px for 15 House bills.
- **Des Moines** leads with the next meeting and Remind me, then the mayor and City Hall, and puts topics, the council, and meetings in tabs. 7,687px → 4,526px.
- **Iowa legislators** shows yours first, then House and Senate tabs of short rows. 16,162px → 8,498px, most of it a tab you chose.
- **A bill** keeps the summary's lead, the vote, and who's behind it up top, and puts its history, votes, full summary, questions, meetings, and related bills in tabs. 4,951px → about 3,000px.
- **A member** keeps who they are, whether they represent you, and how they do the job, then two tabs: what they work on, and how they vote.
- **Settings** says what it's for, puts notifications first, and links to "Where you live", which opens a change-your-address form on My Reps.
- **Progress** folds the rank ladder behind "All 9 ranks".
- **Typos:** the two dropped spaces are fixed.

### Round 2: scores

| Page | P | Pass | Notes |
| --- | --- | --- | --- |
| Home | 8 | ✓ | |
| Vote | 8 | ✓ | |
| My Reps | 8 | ✓ | |
| Progress | 8 | ✓ | |
| Leaderboard | 8 | ✓ | |
| Federal | 8 | ✓ | |
| Upcoming votes | 7 | ✓ | Long, but it's the list you came for, a chamber at a time. |
| Bills, Topics, Legislators, States, Iowa bills, Iowa cities | 7 | ✓ | Lists you asked for, searched from the top. |
| A bill | 8 | ✓ | |
| A member | 8 | ✓ | |
| Iowa | 8 | ✓ | |
| Iowa legislators | 7 | ✓ | |
| Iowa meetings | 8 | ✓ | |
| Des Moines, Ankeny | 8 | ✓ | |
| Learn | 7 | ✓ | Long glossary. |
| Settings | 8 | ✓ | |
| Forum | 7 | ✓ | |
| Landing | 8 | ✓ | |

| Story | Pass | How |
| --- | --- | --- |
| S1 | ✓ | "Try it now" goes straight to voting, and signing up is offered after. |
| S2 | ✓ | Onboarding asks your age, then where you live, then shows your reps' faces. Home asks for it too if you skipped. |
| S3 | ✓ | Home's first card is a bill your reps voted on: one tap to vote, and the reveal is right there. |
| S4 | ✓ | Home's "This week" row for Congress, then vote on any bill in the list. |
| S5 | ✓ | Home's "Who represents you": tap the senator. |
| S6 | ✓ | Dotted words open their explanation. |
| S7 | ✓ | Home's statehouse faces, or the Iowa tab. |
| S8 | ✓ | Home's city row, then the city's first card has the meeting, how to speak, and Remind me. |
| S9 | ✓ | Remind me, Tell me how it turns out, or Settings. |
| S10 | ✓ | Tap the progress row. |
| S11 | ✓ | Settings, then Where you live. |
| S12 | ✓ | "Talk about it" on the bill, which opens a post already about it. |

### Round 3: what changed, from the owner's review (2026-11-10)

The owner found what the rounds above missed: the top bar's logo and collapse button sat together and read as one confusing control, search hugged the left, a red "9+" on Vote didn't say what it counted, the loading bar flashed while typing in search, "This week" listed a Legislature that's out until January, Iowa's legislators had no photos, some inputs had no placeholder, the front page couldn't be reached and was thin, and a profile with no username looked like placeholder data.

- **Top bar:** menu button, then the logo (to the front page), search centered, then progress, the bell, and the theme. Signed out, Log in. The rank and XP bar moved to Progress.
- **The bell** holds notifications and the votes waiting on you, counting only what's new. No tab carries a number.
- **Loading:** the bar is for page changes and saves. Search and the bell show skeletons.
- **Search** knows "mayor", "city hall", "town hall", "council", "state senator", and more, and answers with your own.
- **This week** lists the statehouse only when it has something this week. Between sessions, Home's statehouse faces say "back January 11, 2027".
- **Photos:** all 148 Iowa legislators.
- **Upcoming votes:** a "Beat Congress to the vote" bar, and three groups with live counts: voted (closed), waiting on you (open), and already voted on by Congress (closed, at the bottom).
- **Front page:** inside the app, with one question, three steps, the three levels of government with real numbers, promises, questions, and one way in.
- **Profile:** says why it shows "Coolbills member", and offers a username. Opens on Badges when there are no posts.
- **Missing spaces:** text after a tag or a value, holding an `&apos;`, lost its leading space ("billsyou", "floorlist"). All nine places have an explicit `{" "}`.

### Round 3: scores

| Page | P | Pass | Notes |
| --- | --- | --- | --- |
| Top bar (every page) | 8 | ✓ | Every icon has a label or a number that says what it is. |
| Front page | 8 | ✓ | One filled button on the first phone screen. |
| Home | 8 | ✓ | |
| Upcoming votes | 8 | ✓ | Was 7 for length. The groups are closed except the one to act on. |
| Profile (owner) | 8 | ✓ | Was 6: a name that looked like a placeholder, and an empty first tab. |
| Search | 8 | ✓ | Placeholder names what to try, and your own places come first. |
| Iowa legislators | 8 | ✓ | Faces now. |
| Everything else | 7–8 | ✓ | Unchanged from round 2. |

| Story | Pass | How |
| --- | --- | --- |
| S1–S12 | ✓ | As in round 2. |
| S13 | ✓ | Search, type "town hall", tap Des Moines City Council meeting. |
| S14 | ✓ | The bell. |
| S15 | ✓ | Home's Congress row, then the waiting group under the bar. |
| S16 | ✓ | The logo. |

### Round 4: from the owner's review (2026-11-10, evening)

- **Vote** had a count of 410 bills waiting under its heading, which pulled attention off the bill in front of you. It's gone. The bell already has it.
- **Pulse check** (S17): one tap on a member's page starts 3, 5, or 10 of their bills, and ends with how you lined up on those.

| Page | P | Pass | Notes |
| --- | --- | --- | --- |
| Vote | 8 | ✓ | Heading, one line, the session. |
| A member | 8 | ✓ | Pulse check is the one filled button after "Do they represent you?". |
| Pulse check | 8 | ✓ | Says whose bills and why, counts 1 of 3, ends in a summary with two ways on. |

| Story | Pass | How |
| --- | --- | --- |
| S17 | ✓ | "5 bills" on their page, vote on each, read the summary. |

### Round 5: the forum is shelved (2026-11-10)

The owner closed the forum for now. Story S12 (talk about a bill) is paused with it: a bill no longer shows "Talk about it", and `/forum` is a 404. It comes back when `FORUM_OPEN` does.
