# Who will come? 🎉

A tiny, free RSVP tool. Embed three buttons in an email; when invitees click one, their
answer is recorded instantly and everyone sees a live pie chart. You manage events on a
private admin page hosted on GitHub Pages.

- **Hosting:** GitHub Pages (static files only)
- **Database + login + live updates:** [Supabase](https://supabase.com) (free tier)
- **Vote flow:** one click from the email = instant answer (name optional / anonymous)

---

## What you'll set up (about 15 minutes)

You do this once. After that, creating events takes seconds.

1. A **Supabase** project (the database + your host login).
2. Paste your two Supabase keys into `supabase-config.js`.
3. A **GitHub** repo named `jc`, with Pages turned on → your site goes live at
   `https://rimisak.github.io/jc/`.

Follow the steps below in order. ⚠️ **Nothing will work until you finish steps 1–3.**

---

## Step 1 — Create the Supabase project

1. Go to <https://supabase.com>, sign up (free), and click **New project**.
2. Give it any name and a database password (you won't need the password again). Pick a
   region near you. Wait ~2 minutes for it to finish provisioning.

### 1a. Create the database tables
1. In the left sidebar, open **SQL Editor** → **New query**.
2. Open the file `supabase-setup.sql` from this project, copy **all** of it, paste it in,
   and click **Run**. You should see "Success".

### 1b. Turn on email login
1. Sidebar → **Authentication** → **Sign In / Providers** (or **Providers**).
2. Make sure **Email** is enabled. (Magic-link is on by default — you don't need passwords.)

### 1c. Tell Supabase your website address
1. Sidebar → **Authentication** → **URL Configuration**.
2. Set **Site URL** to: `https://rimisak.github.io/jc/`
3. Under **Redirect URLs**, click Add and enter: `https://rimisak.github.io/jc/admin.html`
   - 💡 If you also want to test locally, add your local address too (e.g.
     `http://localhost:8000/admin.html`).

### 1d. Copy your two keys
1. Sidebar → **Project Settings** (gear) → **API**.
2. Copy the **Project URL** and the **anon public** key. You'll paste them next.

---

## Step 2 — Paste your keys into the code

Open `supabase-config.js` and replace the two placeholders:

```js
export const SUPABASE_URL = 'PASTE_YOUR_PROJECT_URL_HERE';
export const SUPABASE_ANON_KEY = 'PASTE_YOUR_ANON_PUBLIC_KEY_HERE';
```

> The anon key is **safe to publish** — it's designed for browsers. Your data is protected
> by the security rules from `supabase-setup.sql` (only you can create/delete events).

---

## Step 3 — Put it on GitHub Pages

1. Create a new GitHub repository named **`jc`** under your account **`rimisak`**
   (so the address becomes `rimisak.github.io/jc`). Make it **Public**.
2. Upload **all** the files in this folder to the repo (drag-and-drop on github.com works,
   or use git). The files are:
   `index.html`, `admin.html`, `admin.js`, `vote.html`, `vote.js`,
   `supabase-config.js`, `styles.css`.
3. In the repo: **Settings → Pages**. Under **Build and deployment → Source**, choose
   **Deploy from a branch**, pick branch **`main`** and folder **`/ (root)`**, then **Save**.
4. Wait a minute, then visit **`https://rimisak.github.io/jc/`**. 🎉

---

## How to host an event (everyday use)

1. Go to **`https://rimisak.github.io/jc/admin.html`**.
2. Enter your email → **Send magic link** → open the email on the same device → you're in.
3. Fill in **Create an event** and click **Create event**.
4. On the event in the list, click **Copy email buttons**. This copies the **rendered**
   buttons to your clipboard (and shows a live preview).
5. In your email program (Apple Mail, Gmail, Outlook), click in the message body and
   **paste** (⌘V, *not* "Paste and Match Style"). The colored, clickable buttons drop
   right in.
   - If a client refuses the paste, select the buttons in the on-screen **preview** and
     copy them, or expand **Show raw HTML code** to grab the source.
6. Send it. As people click, watch the counts update on your admin page (and on the
   results page).

### Deleting an event
On the admin page, click **Delete event** on any event. This removes the event and all of
its responses. (This is the "delete a check-in I no longer need" feature.)

---

## How it looks to your guests

- They click a button in your email → land on the results page → their answer is **already
  recorded** (one click).
- They can optionally type their **name**, or leave it blank to stay **Anonymous**.
- They can **change** their answer; it won't create duplicates (their browser remembers
  their response).
- They see a **live pie chart** of everyone's answers.

---

## Good to know

- **Free:** Supabase's free tier and GitHub Pages are both free for this scale.
- **Why one click is safe from spam-scanners:** the vote is recorded by JavaScript when the
  page opens, not by the link itself — so automated email link-checkers (which don't run
  JavaScript) won't cast fake votes.
- **Honesty, not security:** this is a casual RSVP tool. A determined person could vote from
  several browsers. That's expected and fine for events.
- **Privacy:** anyone with an event link can see that event's results. Don't share links you
  want kept private.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Admin page won't sign me in | Check Step 1c — the redirect URL must exactly match `admin.html`. Open the magic link on the **same device/browser**. |
| "Could not be found" on vote page | The event was deleted, or the link's event id is wrong. |
| Counts don't update live | Make sure the last line of `supabase-setup.sql` ran (adds `responses` to realtime). |
| Buttons paste as plain text in email | Use your email client's "Insert HTML" option, or copy the snippet shown on the admin page. |
| Nothing loads / console errors about keys | You didn't finish Step 2 (paste your Supabase URL + anon key). |
