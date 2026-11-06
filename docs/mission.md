# Mission

**Coolbills demystifies government in the U.S., both federal and state. It does what Congress.gov does, 10 times better, by working for the person using it.**

Federal comes first, and state follows. Build every model, route, and screen so a state can be added without redoing it. See [Federal and state](ui-guidelines.md#federal-and-state).

Read this before starting any task. If a change doesn't serve these goals, question it.

## The one question every screen answers

> **Does my representative represent me, and what should I do next?**

## Goals

1. **Representation alignment is the core.** Someone should be able to feel represented or not, and tell whether each of their reps is doing a good job, and whether they represent *them*. Those are two different questions, and the app answers both.
2. **Vote first, then find out.** People vote on a bill before they learn how their rep voted. Keep the rep's vote hidden unless they ask to see it. The moment of reveal is the product.
3. **There's always something to do.** Every page ends in a clear next step, and the steps keep coming until the person gets bored.
4. **Government, in plain words.** Show what's coming up, what it's about, who's behind it, and what it means. Translate legislative jargon accurately and simply.
5. **Fun.** Think Duolingo: bright, chunky, rewarding, with quick wins and visible progress. It should feel like a game you want to come back to, without being unserious about the facts.
6. **Mobile first.** Most people will use this on a phone, one-handed.

## Principles

- **Facts first, never partisan.** The app never tells someone which party or position is right. "Doing a good job" means measurable things compared with peers: showing up, getting bills through, and voting independently or with their party. Only the *user* decides whether a rep represents them.
- **Never invent data.** A missing number is shown as missing, with the reason and what to do instead. No placeholder figures, and no AI text presented as fact.
- **Plain language can't change the meaning.** A simple explanation that's wrong is worse than jargon.
- **Work for the user.** Remember what they did. Don't ask twice. Put their reps, their votes, and their next step first.
- **Fast is a feature.** Content arrives in the first response, and pages answer in well under a second.

## Who it's for

Someone who cares but doesn't follow Congress closely. They don't know what "cloture" means, can't name their House rep, and have five minutes on a phone.

**User stories that must feel natural:**

- I open the app, find out who represents me without typing much, and see their faces.
- My rep just voted on something. I'm told so, I vote without knowing how they voted, and then I find out whether we match.
- I see what the House may vote on next week, what each bill is about at a glance, and who's behind it. I weigh in before they vote.
- I can tell in seconds whether my senator represents me, and on which topics we differ.
- I hit a word I don't know, and tapping it explains it.
- I finish one thing, and the app offers the next one.

## Standing rules

- Never test or call AI or paid services unless the user says to: Gemini, Lemonfox, SMTP email, Upstash.
- Local databases only. The local database may be purged and rebuilt when that's the right call. Never touch production, and don't push.
- Don't let a data gap stop the work. Build the pipeline, change the schema, or rebuild. Never get around a site's block on automated access: find another legitimate source, and if there isn't one, show the gap honestly and report it.

## Related sheets

- [UI guidelines](ui-guidelines.md): how to build every screen
- [Data guidelines](data-guidelines.md): schemas, queries, pipelines, and gaps
- [Acceptance criteria](acceptance-criteria.md): how we know it's done
- [Build log](build-log.md): what's done, and what's next
