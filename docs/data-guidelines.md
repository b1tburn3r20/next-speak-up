# Data guidelines

**Target:** accurate, complete data that answers the user's questions quickly. **Goal:** no page runs a slow query, and no gap goes unexplained.

## Requirements

1. **Get what the user needs.** If a screen needs data we don't have, go to `../civic-pipeline` and build the pipeline. Don't fake it on the page.
2. **Change the schema when it helps.** Add tables and columns through Prisma migrations. If a query would get slow, restructure. The local database may be purged and rebuilt, since raw documents make a reload free.
3. **Precompute what's expensive.** Stats that need thousands of rows belong in rollup tables that the pipeline fills: `member_stat`, `member_policy_stat`. Pages read one row.
4. **Select only what's shown.** Every query names its fields. Lists never load bill text, or positions they don't show.
5. **Index what's queried.** A new `where` or `orderBy` on a large table needs a matching index. Check with `EXPLAIN`.
6. **No per-row queries in a loop.** Load in batches.
7. **Filter in the database.** If a rule is used in `where`, store it as a column, like `roll_call.isFinalVote`.

## Speed targets

Measured on a production build with the local database:

| Page | First byte |
| --- | --- |
| Lists, dashboard, bill page, member page | Under 300ms |
| `/api/civic/*` reads | Under 150ms |

## Gaps

There shouldn't be gaps. When there are, handle them this way:

| Gap | What we do |
| --- | --- |
| No CRS summary yet | Say so, and show the title, sponsor, topic, latest action, and text link instead |
| No policy area | "Not categorized yet". Never guess |
| No photo | Initials on a colored circle |
| Rep hasn't voted on anything lately | Say when Congress last voted, rather than showing zeros as if they mean something |
| Member missed a vote | "Didn't vote". It never counts as agreeing or disagreeing |
| Not enough shared votes | Say how many more are needed, instead of a score |
| A vote exists but positions aren't in yet | Show the result from bill actions, and say positions are coming |
| Senate data lag | The `senate_gap` check compares vote numbers in bill actions with stored votes. Show "as of" dates |
| Bill text not stored | Link to the official text |

A check in `checks/rules.py` should catch each gap that the pipeline can detect.

## Sources

| Data | Source | Notes |
| --- | --- | --- |
| Bills, actions, sponsors, summaries, text | Congress.gov API | Throttled below the documented 5,000 requests an hour |
| Each member's full sponsored bill history | Congress.gov API, `/member/{id}/sponsored-legislation` | Complete records without loading every bill |
| House votes | House Clerk XML | Cross-checked against the Congress.gov API |
| Senate votes | Voteview | senate.gov refuses automated requests, so we don't use it |
| Iowa legislators, bills, meetings | legis.iowa.gov | `/chambers/` is disallowed by robots.txt, so nothing reads it |
| Iowa votes | The journal page each bill's history links to | Only loaded if names and both sets of totals agree |
| Iowa bill summaries | The explanation at the end of each bill's PDF | Written at introduction, and legislators don't vote on its wording. Label it that way |
| Des Moines officials | www.dsm.city council page | Mayor, at-large, and ward members. City offices are nonpartisan, so no party is shown |
| Des Moines meetings | The city's published schedule, its meetings page, and agenda PDFs | Topics are the agenda's own lines after the consent agenda. dsmcity.primegov.com is off limits by robots.txt |
| Senate floor | GovInfo's Senate Calendar and Daily Digest | Only what its orders name. The Senate publishes no weekly list, so a short list isn't a quiet week |
| Upcoming House floor | docs.house.gov weekly XML | "May be considered" |
| Member photos | Congress.gov depictions | |

## Accuracy rules

- Status comes only from `transforms/bill_status.py`. Never sort actions by time.
- A rep's position on a bill is their **latest final vote**, using `isFinalVote`. The Python and TypeScript versions must agree, and tests hold them to the same cases.
- A plain-language explanation of a term, action, or policy area must be accurate. Check it against official definitions, and leave it out if unsure.
- Summaries are shortened by extracting CRS's own sentences, never by rewording them.
