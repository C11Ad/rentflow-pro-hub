# Auth & verification email setup

If **verification (confirmation) emails** or **welcome emails** are not reaching users after signup, check the following.

---

## 0. Verification link goes to localhost in production

If the **confirmation or password-reset link in the email points to `http://localhost:3000`** instead of your production URL, do both of the following.

### A. Set Supabase Site URL and Redirect URLs

1. In **Supabase Dashboard** go to **Authentication** → **URL Configuration** (or **Project Settings** → **Auth** → **URL Configuration**).
2. Set **Site URL** to your production app URL, e.g. `https://yourdomain.com` (no trailing slash).
3. Under **Redirect URLs**, add your production URL(s), e.g.:
   - `https://yourdomain.com/**`
   - `https://yourdomain.com`
   Add any other domains you use (staging, etc.). Supabase will only redirect to URLs in this list.

Supabase uses **Site URL** when building the verification and password-reset links in emails. If it is left as `http://localhost:3000`, all links will point to localhost.

### B. Set app URL in production build

Set the env variable **`VITE_APP_URL`** to your production URL when building the app (e.g. in Coolify, Vercel, or your CI). The app uses this for `emailRedirectTo` and password-reset redirects so links point to your live site.

Example (Coolify / Docker):

- `VITE_APP_URL=https://yourdomain.com`

Example (Vercel / Netlify): add in project environment variables:

- `VITE_APP_URL=https://yourdomain.com`

Do **not** add a trailing slash. The app will send this as the base for confirmation and reset links.

---

## 1. Supabase confirmation email (optional)

If you have **Confirm email** enabled in Supabase (Authentication → Providers → Email → “Confirm email”), Supabase sends a “Confirm your email” link. That email is sent by Supabase, not by the app.

### Why it might not arrive

- **Default Supabase mailer** only sends to pre-authorized addresses and is rate-limited. It is not suitable for production.
- You must configure **custom SMTP** so Supabase can send to any user.

### Fix: Configure custom SMTP in Supabase

1. In **Supabase Dashboard** go to **Authentication** → **SMTP** (or **Project Settings** → **Auth** → **SMTP**).
2. Enable **Custom SMTP** and set:
   - **Sender email** – e.g. `noreply@yourdomain.com`
   - **Sender name** – e.g. `Cribhub`
   - Your SMTP host, port, user, and password

Supabase supports:

- [Resend](https://resend.com)
- AWS SES
- Postmark
- SendGrid
- Others (generic SMTP)

Use the same provider/domain you use for the welcome email so “from” is consistent and less likely to be filtered.

### After SMTP is set

- New signups will receive the Supabase confirmation email from your SMTP.
- The app shows “Check your email” and “Resend confirmation email” when confirmation is required.

---

## 2. Welcome email (Edge Function + Resend)

The app sends a **welcome email** via the `send-welcome-email` Edge Function, which uses **Resend**.

### Why it might not arrive

- **`RESEND_API_KEY`** is not set in Supabase (Edge Functions → `send-welcome-email` → **Secrets**).
- **Resend domain** (e.g. `cribhub-gh.com`) is not verified in Resend.
- The function fails and the app only shows a generic “Welcome email could not be sent” toast.

### Fix: Configure Resend for the Edge Function

1. In [Resend](https://resend.com), get an **API key** and add your sending domain (e.g. `cribhub-gh.com`).
2. In **Supabase Dashboard** → **Edge Functions** → **send-welcome-email** → **Secrets**, add:
   - `RESEND_API_KEY` = your Resend API key
3. In the function, the “from” address must use a verified domain (e.g. `Cribhub <support@cribhub-gh.com>`).

After this, signups should receive the welcome email. If the function still fails, check Edge Function logs in Supabase for the exact error.

---

## Summary

| Email type              | Who sends it     | Where to configure                          |
|-------------------------|------------------|---------------------------------------------|
| Confirmation (verify)   | Supabase Auth    | Dashboard → Auth → SMTP (custom SMTP)        |
| Welcome email           | Edge Function    | Resend API key in Edge Function secrets     |

Both need to be set up for all users to receive verification and welcome emails.
