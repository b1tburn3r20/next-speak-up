# Data guidelines

**Target:** accurate, complete data that answers the user's questions quickly. **Goal:** no page runs a slow query, and no gap goes unexplained.

## Requirements

1. **Get what the user needs.** If a screen needs data we don't have, go to `../civic-pipeline` and build the pipeline. Don't fake it on the page.
2. **Change the schema when it helps.** Add tables and columns through Prisma migrations. If a query would get slow, restructure. The local database may be purged and rebuilt, since raw documents make a reload free.
3. **Precompute what's expensive.** Stats that need thousands of rows belong in rollup tables that the pipeline fills: `member_stat`, `member_policy_stat`, and `member_sponsored_bill`. Pages read one row, or one short list.
4. **Select only what's shown.** Every query names its fields. Lists never load positions they don't show. Bill text isn't in the database at all: it's fetched on request.
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
| Bill text | Never stored. `fetchBillText` gets the latest version from Congress.gov when someone opens it, cached 30 days in Next's data cache. If Congress.gov doesn't answer, or the bill is too long, say so and link to the official text |

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
| Every city in a state | The Census Gazetteer and population estimates, then each city's own site | A site only counts once it proves it's that city in this state: its state's name, ZIP code, or phone area code, and never the city named with another state. robots.txt is followed for each site, including its rules for Claude's agents, and a site that disallows us is marked blocked. CivicClerk is only read when the user runs it. A mayor is only kept when the page names them beside "Mayor". Passed measures need their own motion that carried |
| City legislative districts | Census TIGERweb: the state's legislative maps and each city's boundary | Overlaid, not looked up by a single point, so a city that crosses a line lists every district, with its share of the city. A district under 0.5% of a city is a mapping sliver and isn't counted |
| City Hall | The state's municipal directory when we have it, then the city's own footer | A site's footer never replaces a directory's value. The address must name this city, this state, and a ZIP code in the state. A fax, home, police, or fire number is never taken as City Hall's |
| Push subscriptions | The browser, when someone turns notifications on | Only a browser push service's address is accepted (`isPushEndpoint`), because the server sends to it. One the service says is gone (404 or 410) is deleted, and so is one that fails 5 times in a row |
| Sent notifications | `notification_delivery`, one row per person, kind, and `refKey` | Written before sending, so the unique key stops a second send. A vote or a new law older than 3 days isn't sent, so a pipeline backfill stays quiet. A meeting reminder is never sent on a later day than its slot |
| Sponsored bills, whole career | `member_sponsored_bill`, from the same Congress.gov pages `member_stats` counts | Rewritten each run. A repeated bill counts once, so every chart number equals the length of its list. Bills outside this Congress have no `bill` row, and link to Congress.gov |
| Glossary | `glossary_term`, one row per meaning | Edited by admins. Cached for 7 days under the `glossary` tag, which every edit expires. Acronyms in capitals match only in capitals |
| AI-blocked city sites | Read only by the owner (`cities_{state}_owner`) | Claude never runs it, and never reads those sites' pages. Claude reads only the report of counts and errors. A site that disallows every automated reader isn't read at all |
| Des Moines meetings | The city's published schedule, its meetings page, and agenda PDFs | Topics are the agenda's own lines after the consent agenda. dsmcity.primegov.com is off limits by robots.txt |
| Senate floor | GovInfo's Senate Calendar and Daily Digest | Only what its orders name. The Senate publishes no weekly list, so a short list isn't a quiet week |
| Upcoming House floor | docs.house.gov weekly XML | "May be considered" |
| Member photos | Congress.gov depictions | |

## Accuracy rules

- Status comes only from `transforms/bill_status.py`. Never sort actions by time.
- A rep's position on a bill is their **latest final vote**, using `isFinalVote`. The Python and TypeScript versions must agree, and tests hold them to the same cases.
- A plain-language explanation of a term, action, or policy area must be accurate. Check it against official definitions, and leave it out if unsure.
- Summaries are shortened by extracting CRS's own sentences, never by rewording them.
