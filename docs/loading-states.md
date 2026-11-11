# Loading states

Every request someone can wait on has a matching loading state. A request that fills part of the screen gets a skeleton shaped like what it loads. A request that saves something keeps the content in place and shows its progress on the control, because replacing a form with gray boxes would lose someone's place. `tests/unit/loading-coverage.test.ts` fails if a page or an API route isn't covered here.

The skeletons are in `components/app/skeletons.tsx`.

## Pages

| Kind | How it loads | Pages |
| --- | --- | --- |
| List and home pages | `loading.tsx` beside the page, in a route group when it has child pages | Dashboard, federal home, bills, legislators, topics, upcoming, reps, vote, progress, leaderboard, settings, feedback, forum, onboarding, every admin list, My City, the list of states, and Iowa's hub, bills, legislators, meetings, cities, and each city |
| Detail pages | An existence check, then `<Suspense>` around the content | Bill, bill text, roll call, legislator, topic, profile, forum post, admin user, and Iowa's bill, roll call, legislator, meeting, city official, and city meeting |
| Client dashboards | The page waits only on a session check, and the client shows the skeleton while it fetches | Pipeline run log, which uses `RunDetailSkeleton` |
| Static pages | Nothing to wait for | Landing, learn, mission, privacy |
| Redirects | Nothing to show | `/community/users/{id}`, `/admin/permissions/{id}`, `/forum/create-forum-post`, and `/state`, which sends people to their state or to `/states` |

Detail pages can't use `loading.tsx`, because it makes a missing page return 200 instead of 404.

## Requests that fill part of the screen

| API route | Used by | While waiting |
| --- | --- | --- |
| `admin/pipelines/[...path]` | Pipelines dashboard, run log | `PipelinesSkeleton`, `TableSkeleton`, `RunDetailSkeleton` |
| `civic/bills/ask` | Ask AI | `AnswerSkeleton` in the conversation |
| `civic/bills/reveal` | How your reps voted | `RevealSkeleton` |
| `civic/cities` | City search, in the state district picker | `Skeleton` rows in the list |
| `civic/location/districts` | Location picker | `SelectSkeleton` |
| `civic/policy-lean` | Vote session | `LeanSkeleton` |
| `civic/pulse` | The count on the nav | A skeleton dot the same size |
| `civic/reps` | Onboarding | `RepsRowSkeleton` |
| `forum/comments` | Forum post comments, also saving a comment | `Skeleton` rows; the Post button shows progress when saving |
| `search` | Search dialog | `ResultSkeleton` |
| `search/[provider]` | Search dialog | `ResultSkeleton`, for each provider |

## Requests that save

These keep the content on screen. The control is disabled or shows a spinner, and the top progress bar also moves, because it watches every `fetch`.

| API route | Used by | While waiting |
| --- | --- | --- |
| `account/login`, `account/signup` | Password form | Button disabled |
| `admin/feedback`, `admin/moderation` | Admin action buttons | Button disabled |
| `admin/permissions`, `admin/permissions/create-permission`, `admin/roles`, `admin/roles/create-role`, `admin/roles/assign-permission-to-role`, `admin/roles/remove-permission-from-role` | Permission grid | The switch or button disabled |
| `admin/roles/assign-role-to-user` | Role select | Select disabled |
| `bug-report`, `feature-suggestion` | Feedback form | Button disabled |
| `civic/actions/contact` | Contact your rep | Updates right away, and undoes on failure |
| `civic/bills/follow`, `civic/people/favorite`, `civic/topics` | Follow, save, and topic buttons | Updates right away, and undoes on failure |
| `civic/bills/listen` | Listen button | Spinner on the button |
| `civic/bills/skip` | Vote gate | Button disabled |
| `civic/bills/vote` | Support and Oppose | Buttons disabled |
| `civic/events/attend` | "I went" button | Button shows "Saving…" |
| `civic/leaderboard` | Leaderboard opt-in | Switch disabled |
| `civic/location` | Location picker | Button disabled |
| `civic/location/state` | State district picker | Button shows "Saving…" |
| `civic/location/city` | Ward picker | Button shows "Saving…" |
| `civic/location/home-city` | "I live here" on a city's page, and the city prompt on the dashboard and state page | Button shows "Saving…" |
| `civic/onboarding` | Onboarding | Button disabled |
| `forum/bookmark`, `forum/lock`, `forum/pin` | Post controls | Spinner on the button |
| `forum/comment-vote`, `forum/post-vote` | Vote arrows | Updates right away, and blocks another tap |
| `forum/comments/delete`, `forum/posts/delete` | Delete buttons | Button disabled |
| `forum/new-post` | Forum composer | Button disabled |
| `notifications/subscription` | Turning notifications on or off, in settings, "Remind me", and "Tell me how it turns out" | Button shows "Turning on…" or "Setting up…" |
| `notifications/preferences` | The notification switches in settings | The switch moves right away, and moves back on failure |
| `notifications/test` | "Send me a test" in settings | Button shows "Sending…" |
| `notifications/inbox` | The bell in the top bar | The bell shows a skeleton list while it loads, and the badge waits for the answer |
| `civic/people/pulse-check` | The summary at the end of a pulse check | A skeleton of the summary until it answers |
| `civic/people/sponsored` | The bill lists that open from a member's topic chart and Became law card | Skeleton rows in the dialog or popover, and "Loading…" on Show more |
| `admin/glossary` | The glossary admin page's add, edit, and remove | Buttons show "Saving…" or "Removing…", and the row stays in place until it's done |
| `send-email` | Nothing calls it now: the front page sends people to `/feedback` instead | None |
| `user/check-username-availability`, `user/set-username` | Username dialog | Spinner beside the field |
| `user/profile`, `user/settings` | Profile edit mode | Save shows "Saving…" |

## Requests with nothing to show

| API route | Why |
| --- | --- |
| `auth/[...nextauth]` | NextAuth's own redirects |
| `user/onboarding` | Decides whether to send someone to onboarding |
| `civic/floor`, `health` | Data for other programs and tests. No screen calls them |
| `civic/progress` | Moves the XP bar after an action. The bar already shows the last number, so nothing is empty |
| `civic/events/[id]/ics` | A file download. The browser shows its own progress |
| `cron/notify` | Called by a scheduler, with `CRON_SECRET`, to send due notifications. No screen calls it |

## Routes nothing calls

No code in the app calls these. They've been left alone, and are worth removing once `main`'s old app is gone.

`admin/permissions/check-permission`, `admin/permissions/get-all-permissions`, `admin/roles/check-role`, `admin/roles/get-all-roles`, `admin/roles/get-role-data`, `user-preferance`, `user/settings/demographics`, `user/settings/email`, `user/settings/state`, `user/settings/username`, `user/tts-voice-preference`
