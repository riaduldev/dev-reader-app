# Authentication — DevReaderHub

Supabase Auth ব্যবহার করে DevReaderHub-এর সাইন-ইন, সাইন-আপ, password reset,
OAuth callback ও session handling। এই ডকুমেন্টে প্রতিটি ধাপ, প্রয়োজনীয়
configuration, প্রতিশ্রুত আচরণ এবং troubleshooting দেওয়া আছে।

Implementation:
`src/lib/auth/*`, `src/app/auth/callback/route.ts`, `src/app/login`,
`src/app/signup`, `src/app/forgot-password`, `src/app/reset-password`,
`src/proxy.ts`।

---

## ১. কোন পদ্ধতিগুলো সক্রিয়

| পদ্ধতি | Supabase-এ কী দরকার | UI অবস্থা |
|---|---|---|
| Email + password | Authentication → Email provider (default সক্রিয়) | সবসময় দেখা যায় |
| Google OAuth | Authentication → Providers → Google (Client ID + Secret) | Provider না চালু থাকলে বাটন disabled + কারণ লেখা |
| GitHub OAuth | Authentication → Providers → GitHub (Client ID + Secret) | Provider না চালু থাকলে বাটন disabled + কারণ লেখা |

Provider-এর অবস্থা রেন্ডার টাইমে `/auth/v1/settings` endpoint থেকে পড়া হয়
(`src/lib/auth/settings.ts`)। এই endpoint-টি public এবং secret ধারণ করে না।
ফলে UI কখনো কাজ না করা এমন বাটন দেখায় না।

---

## ২. Google OAuth সেটআপ

1. **Google Cloud Console** → নতুন প্রজেক্ট বা বিদ্যমান প্রজেক্ট নির্বাচন করুন।
2. **APIs & Services → Credentials** → **Create Credentials → OAuth client ID** →
   Application type: *Web application*।
3. **Authorized redirect URIs**-এ যোগ করুন:
   * `https://<project-ref>.supabase.co/auth/v1/callback`
4. **Authorized JavaScript origins**-এ যোগ করুন:
   * `https://<your-app-domain>` (production)
   * `http://localhost:3000` (local development)
5. Client ID ও Client Secret কপি করে **Supabase Dashboard → Authentication →
   Providers → Google**-এ বসান, **Save** চাপুন।
6. (ঐচ্ছিক) Google-এর “Authorized domains”-এ আপনার অ্যাপ ডোমেইন যোগ করুন।

---

## ৩. GitHub OAuth সেটধা

1. **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**।
2. **Application name**: `DevReaderHub`।
3. **Homepage URL**: `https://<your-app-domain>`।
4. **Authorization callback URL**:
   `https://<project-ref>.supabase.co/auth/v1/callback`
5. **Client ID / Client Secret** কপি করে **Supabase Dashboard → Authentication →
   Providers → GitHub**-এ বসান ও **Save** চাপুন।

---

## ৪. Redirect URL ও local development

Supabase-এর **Authentication → URL Configuration**-এ:

* **Site URL**: production-এ `https://<your-app-domain>`, local-এ
  `http://localhost:3000`।
* **Redirect URLs**-এ যোগ করুন:
  * `http://localhost:3000/auth/callback`
  * `https://<your-app-domain>/auth/callback`
  * `http://localhost:3000/reset-password`
  * `https://<your-app-domain>/reset-password`

`redirect_to` মান তৈরি হয় `src/lib/auth/actions.ts`-এর `buildOAuthRedirectUrl()`
থেকে:

1. `NEXT_PUBLIC_SITE_URL` সেট করা থাকলে সেটিই ব্যবহার হয় (production-এ এটিই
   সবচেয়ে নির্ভরযোগ্য)।
2. না থাকলে forwarded host থেকে origin তৈরি হয় — যা শুধু plain host pattern
   (`a-z0-9.-`) মেনে নেওয়া হয়, তাই অন্য পথ ইনজেক্ট করা যায় না।

যে কোনো অবস্থাতেই `next` প্যারামিটার same-site path-ই হতে হবে
(`safeRedirectPath()`, `src/lib/auth/errors.ts`) — `https://evil.example` বা
`//evil.example` ধরা পড়ে ফিরে যায় না।

---

## ৫. Flow

### ৫.১ Email + password

* **Sign up** (`src/lib/auth/actions.ts` → `signupAction`)
  1. Zod দিয়ে ইমেইল/পাসওয়ার্ড/নাম যাচাই (পাসওয়ার্ডে অন্তত ৮ অক্ষর, একটি
     অক্ষর ও একটি সংখ্যা)।
  2. `supabase.auth.signUp()` — `emailRedirectTo` দিয়ে যাচাই লিংক পাঠানো হয়।
  3. **Email confirmation চালু থাকলে** কোনো session তৈরি হয় না; UI-তে স্পষ্ট
     “ইমেইল যাচাই করুন” বার্তা দেখানো হয় এবং লগইন লিংকে যাওয়ার অপশন থাকে।
  4. Session তৈরি হলে (confirmation বন্ধ থাকলে) ব্যবহারকারী `/onboarding`-এ যায়।
* **Sign in** (`loginAction`) → সফল হলে `next` (নিরাপদ path) বা `/`।
* **Sign out** → `src/lib/auth/actions.ts` → `signOut()`।

### ৫.২ OAuth (Google / GitHub)

1. ব্যবহারকারী “Continue with Google/GitHub” চাপেন।
2. `signInWithOAuthAction()` provider allow-list (`google`, `github`) যাচাই করে,
   প্রকল্পে provider সক্রিয় কি না দেখে, তারপর `/auth/callback?next=…` ঠিকানায়
   redirect তৈরি করে এবং Supabase-এর authorize URL-এ পাঠায়।
3. Supabase provider-এ পাঠায় → provider ব্যবহারকারীকে authenticate করায় →
   `https://<project-ref>.supabase.co/auth/v1/callback`-এ ফিরে আসে →
   Supabase `code` পাঠায় → `https://<your-app-domain>/auth/callback?code=…&next=…`।
4. `src/app/auth/callback/route.ts` কোডটি **server-side** exchange করে
   (`exchangeCodeForSession`), session cookie response-এ লেখে এবং `next`-এ
   redirect করে।
5. কোনো ত্রুটি হলে (`error`, `error_code`, অথবা অসফল exchange) ব্যবহারকারী
   `/login?error=…` পেজে ফিরে যান এবং বাংলা বার্তা দেখেন — raw server error
   শুধু server log-এ থাকে।

### ৫.৩ Password reset ও recovery

1. `/forgot-password` → `requestPasswordResetAction()` →
   `resetPasswordForEmail(email, { redirectTo: '<origin>/auth/callback?next=/reset-password' })`।
2. উত্তর **সবসময় একই** (“যদি এই ইমেইলে অ্যাকাউন্ট থাকে…”) — এতে ইমেইল ঠিকানা
   খোঁজার (account enumeration) সুযোগ থাকে না।
3. ইমেইলের লিংক → `/auth/callback?code=…&next=/reset-password` → session তৈরি →
   `/reset-password` পেজে নতুন পাসওয়ার্ডের ফর্ম।
4. `updatePasswordAction()` নতুন পাসওয়ার্ড সেভ করে `/settings?password=updated`-এ
   redirect করে।
5. লিংক মেয়াদোত্তীর্ণ হলে `/reset-password` পেজে বোঝানো হয় এবং নতুন লিংক চাওয়ার
   লিংক দেওয়া হয়।

### ৫.৪ Session ও protected route

* `src/proxy.ts` (Next.js 16-এর middleware-এর নতুন নাম) প্রতিটি request-এ
  Supabase session refresh করে এবং cookie সেট করে।
* `/saved`, `/history`, `/settings`, `/onboarding`, `/admin/*` — এগুলো sign-in ছাড়া
  খোলা যায় না; অন্যথায় `/login?next=…`-এ redirect হয়।
* Server component ও server action-এ `getSession()` (`src/lib/auth/session.ts`)
  ব্যবহার করে user, profile ও role পড়া হয়।

---

## ৬. একাধিক পদ্ধতিতে একই ইমেইল (account linking)

Supabase-এর নিরাপদ account-linking আচরণ অনুসরণ করা হয়:

* Google/GitHub থেকে আসা ইমেইল **verified** হলে এবং আগে থেকে একই ইমেইলে
  password account থাকলে Supabase ডিফল্টভাবে দুটো identity একই user-এর সাথে
  জুড়ে দেয় (duplicate account তৈরি হয় না)।
* যে ক্ষেত্রে Supabase linking না করে (যেমন অন্য domain-এর verified email),
  তখন আলাদা account তৈরি হয় — এটি Supabase-এর নীতি।
* **User metadata বিশ্বাস করা হয় না**: `role`, `email` বা যেকোনো permission
  user metadata থেকে পড়া হয় না। Admin role শুধুমাত্র `user_profiles.role`
  কলাম থেকে আসে, যেটি:
  * column-level grant দিয়ে user-এর কাছ থেকে আপডেটযোগ্য নয় (`role` বাদি),
  * `supabase/migrations/0002_auth_onboarding.sql`-এর
    `protect_user_profile_role()` trigger দিয়ে সুরক্ষিত।

Supabase Dashboard-এ **“Linking an identity”** behaviour (manual linking বন্ধ
রেখে automatic linking) রাখলে উপরের আচরণ নিশ্চিত হয়।

---

## ৭. ভাষা নির্বাচন (Language switcher)

* টপবারের **English / বাংলা** বোতামটি পুরো ইন্টারফেস এক সাথে বদলে দেয় — পেজ থেকে বের হয় না।
* বাটামের লেবেল সবসময় **যে ভাষায় যেতে চান** সেটি দেখায় (বাংলা থেকে চললে “English”)।
* রেন্ডারের সময় `drh_lang` cookie-ই উৎস, তাই সার্ভার ও ক্লায়েন্ট সবসময় একই ভাষা দেখায় (কোনো flash বা hydration mismatch নেই)।
* সাইন-ইন করা ইউজারের পছন্দ `user_preferences.language`-এ সেভ হয়, তাই পরের ভিজিটে ও অন্য ডিভাইসেও একই ভাষা থাকে।
* ডিফল্ট ভাষা বাংলা; ব্রাউজারের ভাষা অনুযায়ী অটো-সুইচ করা হয় না, যাতে UI প্রত্যাশিত থাকে।

## ৮. Onboarding ও preferences

* নতুন ইউজার sign up করার পর `/onboarding` পেজে পাঠানো হয় (session তৈরি হলে)।
* পেজে ক্যাটাগরি ও প্রযুক্তি বাছা যায়, অথবা “এখন পরে করব” চেপে এড়িয়ে যাওয়া
  যায়।
* পছন্দ `user_preferences` টেবিলে সংরক্ষিত হয়
  (`categories`, `technologies`, `onboarding_completed`) — RLS-এর মাধ্যমে
  প্রতিটি ইউজারের তথ্য আলাদা থাকে।
* কোনোটি না বাছলেও ডিফল্ট অভিজ্ঞতা কার্যকর থাকে (সব ক্যাটাগরি দেখা যায়)।
* সেটিংস পেজ থেকে পছন্দ পরে পরিবর্তন করা যায়; `onboarding_completed` তবে true
  থাকে, তাই banner আর দেখাবে না।

---

## ৯. Troubleshooting

| সমস্যা | সম্ভাব্য কারণ ও সমাধান |
|---|---|
| “provider এখনো চালু করা হয়নি” | Supabase → Authentication → Providers-এ provider চালু করা হয়নি। |
| Google-এ “redirect_uri_mismatch” | Supabase provider-এর callback ঠিকানা ভুল; সঠিক হলো `https://<project-ref>.supabase.co/auth/v1/callback`। |
| OAuth-এর পর loop | `NEXT_PUBLIC_SITE_URL` ভুল অথবা Redirect URLs-এ অ্যাপের URL নেই। |
| Sign up করলেই ইমেইল আসে না | Supabase project-এর email rate limit (`over_email_send_rate_limit`) অথবা SMTP বন্ধ; Dashboard-এ দেখুন। |
| ইমেইল যাচাই বার্তা এলেও ঢুকতে পারছে না | ইমেইলে গিয়ে যাচাই লিংকে ক্লিক করুন; লিংক না খুললে `/forgot-password` থেকে নতুন লিংক নিন। |
| Password reset লিংক কাজ করে না | লিংকের redirect URL-এ `https://<your-app-domain>/reset-password` অনুমোদিত আছে কি না দেখুন। |
| সব page-এ “Supabase is not configured” | `.env.local`-এ `NEXT_PUBLIC_SUPABASE_URL` ও `NEXT_PUBLIC_SUPABASE_ANON_KEY` নেই বা server restart হয়নি। |

Server log-এ `[auth]` prefix থাকা লাইনগুলো diagnostics-এর জন্য — raw error
ব্যবহারকারীকে দেখানো হয় না, শুধু বাংলা বার্তা দেখানো হয়।
