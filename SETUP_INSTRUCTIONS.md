# 🎵 Hierarchy Music — Complete Setup Guide
### Written clearly, step by step 🙂

---

## WHAT YOU'RE BUILDING

A real live website. Here's how the pieces connect:
```
Your Code → GitHub (storage) → Vercel (publishes it) → Supabase (database)
```

---

## STEP 1 — Install Node.js on your computer

1. Go to **nodejs.org**
2. Click the big green **"LTS"** button and download it
3. Open the installer → click Next, Next, Install
4. Open **Terminal** (Mac) or **Command Prompt** (Windows)
5. Type `node --version` → if you see a number like `v20.x.x` it worked ✅

---

## STEP 2 — Set up Supabase (your database)

### Create account + project
1. Go to **supabase.com** → Sign up (free)
2. Click **"New Project"**, name it `hierarchy-music`
3. Set a database password (save it!) → click **Create new project**
4. Wait ~2 minutes

### Build the database — copy this entire block into SQL Editor → Run
In Supabase: click **SQL Editor** → **New Query** → paste everything below → click **Run**

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner','manager')),
  name TEXT, email TEXT, active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE talent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, ig_handle TEXT, tt_handle TEXT,
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE pods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES talent(id) ON DELETE CASCADE,
  name TEXT NOT NULL, platform TEXT NOT NULL CHECK (platform IN ('ig','tt','both')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  username TEXT NOT NULL, tier TEXT DEFAULT 'a' CHECK (tier IN ('a','b')),
  violation_count INTEGER DEFAULT 0, session_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','removed')),
  removed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID NOT NULL REFERENCES talent(id) ON DELETE CASCADE,
  post_url TEXT NOT NULL, session_date DATE NOT NULL,
  session_time TIME, notes TEXT,
  total_ok INTEGER DEFAULT 0, total_violations INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE session_pods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  ok_count INTEGER DEFAULT 0, violation_count INTEGER DEFAULT 0
);
CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL CHECK (violation_type IN ('no_comment','no_like')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent ENABLE ROW LEVEL SECURITY;
ALTER TABLE pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_pods ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile" ON profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "owners_all_talent" ON talent FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id=auth.uid() AND role='owner'));
CREATE POLICY "managers_own_talent" ON talent FOR SELECT USING (manager_id=auth.uid());
CREATE POLICY "auth_pods" ON pods FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_members" ON members FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_sessions" ON sessions FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_session_pods" ON session_pods FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_violations" ON violations FOR ALL USING (auth.uid() IS NOT NULL);
```

### Create your owner login
1. Supabase → **Authentication** → **Add user** → **Create new user**
2. Enter your email + password → **Create User**
3. Copy the **User UID** (long string in the table)
4. SQL Editor → New Query → run this (replace the values!):

```sql
INSERT INTO profiles (id, role, name, email)
VALUES ('PASTE-USER-UID-HERE', 'owner', 'Your Name', 'your@email.com');
```

### Copy your API keys
1. Supabase → **Project Settings** (gear icon) → **API**
2. Copy and save these two values:
   - **Project URL** → looks like `https://abcxyz.supabase.co`
   - **anon public key** → long string starting with `eyJ...`

---

## STEP 3 — Put code on GitHub

### Create a GitHub account + private repo
1. Go to **github.com** → Sign up (free)
2. Click **"+"** top right → **New repository**
3. Name: `hierarchy-music` | Set to **Private** | Click **Create repository**

### Upload your code
1. Unzip the downloaded `hierarchy-music-react.zip` file
2. Open Terminal / Command Prompt, navigate into it:
```bash
cd Desktop/hm-react
```
3. Install packages:
```bash
npm install
```
4. Push to GitHub:
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/hierarchy-music.git
git push -u origin main
```
*(Replace YOUR-USERNAME with your actual GitHub username)*

---

## STEP 4 — Deploy on Vercel

### Create account + import project
1. Go to **vercel.com** → **Sign Up** → **Continue with GitHub**
2. Click **"Add New…"** → **"Project"**
3. Find `hierarchy-music` in your repos → click **Import**

### Add your secret keys ← MOST IMPORTANT STEP
Before clicking Deploy, look for **"Environment Variables"** and add these:

| Name (exactly as shown) | Value |
|------------------------|-------|
| `REACT_APP_SUPABASE_URL` | your Supabase Project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | your Supabase anon public key |

Click **Add** after each one, then click **Deploy** 🚀

Wait 2 minutes → your site is live at a `.vercel.app` URL! 🎉

---

## STEP 5 — Test it

1. Open your Vercel URL
2. Log in with the email + password you created in Supabase
3. You're in! Start adding talent, pods, and members.

---

## STEP 6 — Run it locally on your computer

Create a file called `.env.local` inside the `hm-react` folder with:
```
REACT_APP_SUPABASE_URL=https://yourproject.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

Then:
```bash
npm start
```

Opens at `http://localhost:3000`. The `.env.local` file is in `.gitignore` — it NEVER goes to GitHub.

---

## STEP 7 — Invite managers

1. Supabase → **Authentication** → **Add user** → **Invite user** → enter their email
2. They get a link, set their password
3. SQL Editor → run:
```sql
INSERT INTO profiles (id, role, name, email)
SELECT id, 'manager', 'Their Name', 'their@email.com'
FROM auth.users WHERE email = 'their@email.com';
```
4. Go to Managers page in your app → assign them to talent

---

## STEP 8 — Push updates

Every time you make a code change:
```bash
git add .
git commit -m "what I changed"
git push
```
Vercel auto-rebuilds in ~2 minutes ✨

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page | Press F12 → Console tab → look for red errors |
| "Invalid login" | Check email/password in Supabase Auth |
| Data not loading | Make sure your profile row exists in the profiles table |
| Env var errors | Check Vercel → Project Settings → Environment Variables |
| npm install fails | Run `node --version` — if nothing shows, reinstall Node.js |

---

## Why keys go in Vercel, NOT in your code

If you put your Supabase keys in the code file and push to GitHub, ANYONE can steal your database access. Vercel's Environment Variables keep them hidden — they never appear in your GitHub files. This is the professional way to handle secrets. ✅
