# ZOL — product reference

A living one-pager. Sections 1–2 describe what ZOL is and does (these should
rarely change). Sections 3–5 are state and next steps (update as the build
moves).

---

## 1. What ZOL is

ZOL is an AI voice agent for businesses. It answers the company's phone 24/7,
handles the caller like a great front-desk hire, and writes down everything it
did so the owner can see at a glance.

The first customer is **FNS**, a custom-apparel and gear shop serving
firefighters, EMS, trades crews, and small business shops.

---

## 2. What it does

For the business owner, ZOL turns inbound calls into outcomes — not voicemail.

- **Answers every call, 24/7.** No missed lead, no after-hours dead air.
- **Routes the caller to the right person.** Sales, production, billing, the
  owner — whoever matches the request gets connected or notified.
- **Books appointments on the calendar.** Quote calls, consults, walkthroughs
  — the agent finds an open slot and locks it in while the caller's on the line.
- **Captures messages when no one's available.** Like voicemail, but written
  down, prioritized by urgency, and delivered to the right staff member.
- **Creates follow-up tasks so nothing slips.** Send a mockup, return a
  callback, confirm a deadline — pulled out of the conversation automatically.
- **Records a full transcript + summary of every call.** Searchable, shareable,
  legally clean.
- **Shows every call in a dashboard with the agent's exact run trace.** Owner
  can see what the caller said, what the agent did, every tool it called, and
  what was created — no guessing.
- **Personality is configurable per business.** FNS's agent is warm, witty,
  with a little firehouse banter — openly an AI, and offers a fast track to a
  human anytime.

---

## 3. Where it is today

ZOL is now a **self-serve product**, not just a demo. A business owner can sign
up, name their business, write the agent's personality and pick a voice, and
click once to get a **live phone number** — all in-app. The real integrations
are wired behind the same `USE_STUBS` swap:

- **Auth** (Supabase) — signup/login, magic links, route protection, per-user
  tenant resolution + business switcher.
- **Self-serve onboarding** — creates the business and provisions a VAPI
  assistant + phone number in one step.
- **Real VAPI adapter** — low-latency, human-sounding stack (Deepgram Flux +
  GPT-4o + ElevenLabs/Cartesia voice), with the 5 tools and webhooks wired.
- **Continuously-editable settings** — prompt, greeting, voice, model, and
  staff; saving pushes live to VAPI.
- **Real after-call extraction** (Claude) and **Google Calendar** (per-business
  OAuth) — calendar stays dormant until Google creds are added.

With `USE_STUBS=true` the whole flow still runs locally with no provider spend.
Going live = set the keys (`VAPI_API_KEY`, Supabase, Anthropic, optional
Google), flip `USE_STUBS=false`, deploy the edge functions. See `DEPLOY.md`.

---

## 4. What the build should do next

Take it from runnable skeleton to a real call from a real number:

1. **Provision FNS on the voice platform** — create the assistant, buy/attach
   a phone number, load FNS's personality and tool definitions.
2. **Turn on the real AI model** for the in-call brain (the part that
   understands the caller) and for after-call summarization/task extraction.
3. **Connect Google Calendar** for FNS's staff so the agent can actually
   check availability and book appointments on real calendars.
4. **Deploy the webhooks** that the voice platform calls during a live call,
   so tool actions hit our database in real time.
5. **Stand up a hosted database + dashboard** for FNS to log into.
6. **Run a real end-to-end test call** to the FNS number — agent answers,
   books a calendar slot, logs the task — and verify it all shows up in the
   dashboard.

---

## 5. What Ezaz should do next

Human / business tasks that unblock the build:

- **Accounts & access:** create or share access to the voice platform account,
  the AI model account, the Google Workspace (for Calendar), and the database
  /hosting account.
- **FNS phone setup:** decide whether ZOL takes the main FNS line or a
  parallel line, and confirm what should happen to the *current* after-hours
  flow.
- **Staff & routing:** confirm the FNS staff list — who covers sales,
  production, art, billing, ownership — their phone numbers, and which urgency
  levels go to whom.
- **Approve FNS's personality** — review the system prompt (in `/settings` in
  the dashboard, or `supabase/seed.sql`) and tweak the tone, the do/don't
  list, and the "fast track to a human" wording until it sounds like FNS.
- **Line up a test call with Alex** — schedule a 15-minute live test once the
  number is live, and capture his reactions for the first round of tuning.
