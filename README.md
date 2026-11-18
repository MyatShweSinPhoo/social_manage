# Social Hub (Facebook + TikTok Scheduler)

`fb-post-scheduler` (Facebook) နဲ့ `social-autopilot` (TikTok) ကို **project တစ်ခုတည်း** အဖြစ် ပေါင်းထားပါတယ်။
Login တစ်ခု၊ Database တစ်ခု၊ Server တစ်ခုနဲ့ Facebook Page ရော TikTok ရော schedule လုပ်လို့ရပါတယ်။

| လမ်းကြောင်း | ဘာလဲ |
|---|---|
| `/` | Home – Facebook / TikTok အခြေအနေ အကျဉ်းချုပ် |
| `/facebook` | Facebook Page panel (ပုံ + စာ၊ Draft၊ Post now၊ Retry၊ Settings → Test connection) |
| `/tiktok` | TikTok panel (Video / Photo၊ Approve / Reject / Retry၊ Account ချိတ်ဆက်ခြင်း) |

> TikTok panel မှာ **Facebook input box မပါတော့ပါ**။ Platform ရွေးတဲ့ dropdown၊ "Page ID" လို Facebook ကိုယ်ပိုင်ကွက်တွေ ဖယ်ထားပြီး
> TikTok ပုံစံ (အနက်ရောင် UI၊ 9:16 phone preview၊ `open_id` / TikTok username / token) နဲ့ပဲ ပြထားပါတယ်။
> Facebook ကို `/facebook` မှာသာ စီမံပါတယ်။

## စွမ်းဆောင်ချက်များ
**Facebook:** Admin login၊ ပုံ/စာ post၊ schedule၊ Draft၊ Edit၊ Delete၊ Post now၊ Retry၊ Facebook-style preview၊ 60 စက္ကန့်တိုင်း scheduler။
**TikTok:** Video (MP4/MOV ≤ 64 MB) / Photo၊ TikTok-style preview၊ daily slot (`POST_TIMES`) သို့မဟုတ် ကိုယ်ရွေးတဲ့အချိန်၊ 30 စက္ကန့်တိုင်း worker၊
Token auto refresh၊ ၃ ကြိမ်အထိ auto retry၊ Telegram bot (Approve / Reject / `/idea` / `/queue` / `/stats`) နဲ့ AI caption (optional)။

## Setup

1. **လိုအပ်တာ:** Node.js 20+ နဲ့ MySQL (XAMPP ရဲ့ MySQL ကို Start လုပ်ပါ)
2. Install:
   ```bash
   npm install
   cp .env.example .env      # Windows: copy .env.example .env
   ```
3. `.env` ဖြည့်ပါ (အောက်က ဇယား ကြည့်ပါ)။ `AUTH_SECRET` ထုတ်နည်း:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Database table ဆောက်ပါ (`social_hub` database ကို Prisma က ဆောက်ပေးပါလိမ့်မယ်):
   ```bash
   npm run db:push
   ```
5. Run:
   ```bash
   npm run dev
   ```
   <http://localhost:3000> ကိုဖွင့်ပြီး `ADMIN_USERNAME` / `ADMIN_PASSWORD` နဲ့ login ဝင်ပါ။

**တစ်ခုတည်း run ရုံနဲ့ ရပါပြီ။** `npm run dev` (သို့) `npm start` က Facebook scheduler၊ TikTok worker၊ Telegram bot ကို server ထဲမှာ အလိုအလျောက် တစ်ခါတည်း စတင်ပေးပါတယ်။

### `.env` အဓိက variables

| Variable | ဘာလဲ |
|---|---|
| `DATABASE_URL` | MySQL (XAMPP: `mysql://root:@localhost:3306/social_hub`) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `AUTH_SECRET` | Login (Facebook + TikTok နှစ်ခုလုံး အတွက် တူတူသုံးတယ်) |
| `PUBLIC_BASE_URL` | Website public URL (TikTok Photo post အတွက် လိုတယ်) |
| `FACEBOOK_PAGE_ID` / `FACEBOOK_PAGE_ACCESS_TOKEN` | Facebook Page ချိတ်ဆက်ရန် |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | TikTok developer app (token refresh အတွက်) |
| `TIKTOK_MODE` | `inbox` = TikTok drafts ထဲပို့ (audit မလို၊ app ထဲမှာ တစ်ချက်နှိပ်ရ) / `direct` = တိုက်ရိုက်တင် |
| `TIKTOK_PRIVACY` | TikTok audit မအောင်မချင်း `SELF_ONLY` ပဲ လက်ခံတယ် |
| `POST_TIMES`, `TZ_OFFSET_MIN`, `TZ_NAME` | TikTok နေ့စဉ် slot အချိန်များ + timezone (Myanmar = 390) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_IDS` | Telegram bot (optional) |
| `ANTHROPIC_API_KEY` | AI idea/caption (optional) |
| `ENABLE_INTERNAL_SCHEDULER` | `true` = server ကိုယ်တိုင် post တင်မယ် |
| `ENABLE_TELEGRAM_BOT` | `false` = bot ကို web server ထဲမှာ မ run ဘူး |
| `CRON_SECRET` | External cron အတွက် |

## Facebook ချိတ်ဆက်ပုံ
`.env` ထဲမှာ Page ID နဲ့ long-lived **Page** access token ထည့်ပါ (permissions: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`)။
`/facebook/settings` မှာ **Test connection** နှိပ်ပြီး စစ်ပါ။ Page ကိုပဲ post တင်လို့ရတယ် (personal profile မရပါ)။ ပုံ JPG/PNG/WEBP/GIF ≤ 8 MB။

## TikTok ချိတ်ဆက်ပုံ
`/tiktok/accounts` မှာ TikTok username၊ `open_id`၊ access token၊ refresh token၊ token lifetime (86400) ထည့်ပါ။
Access token (၂၄ နာရီ) ကို refresh token နဲ့ အလိုအလျောက် ပြန်ယူပါတယ်။

## Telegram bot (TikTok အတွက်)
- `/start` ပို့ပြီး ကိုယ့် Telegram ID ကိုယူ → `TELEGRAM_ADMIN_IDS` ထဲထည့် → server restart
- Video/Photo + caption ပို့ရင် **Approve / In 1 hour / Reject** ခလုတ်ပေါ်လာမယ်
- `/idea <topic>` (AI idea 5 ခု)၊ `/queue`၊ `/stats`
- Bot ကနေ download လို့ရတာ 20 MB အထိပဲ၊ ပိုကြီးရင် web panel မှာ upload လုပ်ပါ

## Server အမြဲဖွင့်ထားရမယ်
Scheduler က server ထဲမှာ run တာမို့ **server ပိတ်ထားရင် post မတင်ပါ**။ တကယ်သုံးရင် VPS မှာ `npm run build && npm start` (PM2 နဲ့) run ပါ။

**Vercel လို serverless** မှာဆိုရင် `ENABLE_INTERNAL_SCHEDULER="false"` + `CRON_SECRET` ထည့်ပြီး external cron နဲ့ မိနစ်တိုင်း ခေါ်ပါ
(Facebook + TikTok နှစ်ခုလုံး တစ်ခါတည်း တင်ပေးတယ်):
```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://your-site.com/api/cron/publish
# တစ်ခုချင်းဆို:  ...?platform=facebook   သို့   ...?platform=tiktok
```
Telegram bot ကို သီးသန့် process နဲ့ run ချင်ရင် `.env` မှာ `ENABLE_TELEGRAM_BOT="false"` လုပ်ပြီး `npm run services` ကို သုံးပါ။

## Folder ဖွဲ့စည်းပုံ
```
prisma/schema.prisma        fb_posts · tt_accounts · tt_posts · tt_ideas
src/
  middleware.ts             Login ကာကွယ်မှု (cron + TikTok media မှလွဲ)
  instrumentation.ts        FB scheduler + TikTok worker + bot စတင်
  app/
    page.tsx · login/       Home + shared login
    facebook/               Facebook panel
    tiktok/                 TikTok panel (tiktok.css က .tt အောက်မှာပဲ သက်ရောက်)
    api/auth · api/cron     login/logout · cron (နှစ်ခုလုံး)
    api/facebook/*          posts, uploads, check, run
    api/tiktok/*            posts, accounts, media
  lib/facebook/*            Graph API, publisher, scheduler, uploads
  lib/tiktok/*              TikTok API publisher, slots, AI, telegram
  services/                 worker.ts · bot.ts · standalone.ts
uploads/facebook · uploads/tiktok   တင်ထားတဲ့ media (git ထဲမပါ)
```

## မှတ်ချက် / သတိပြုရန်
- Token တွေကို DB ထဲ encrypt မလုပ်ဘဲ သိမ်းထားတယ် → production မတင်ခင် encrypt လုပ်ပါ၊ `.env` ကို git ထဲ မတင်ပါနဲ့။
- TikTok video 64 MB ထက်ကြီးရင် chunked upload မပါသေးပါ။
- TikTok / Facebook API နှစ်ခုလုံးကို live မစမ်းရသေးပါ → Facebook test Page၊ TikTok `SELF_ONLY` နဲ့ အရင်စမ်းပါ။
- Login rate-limit မပါပါ၊ password ခိုင်ခိုင်ထားပါ။
- ဒီ project ကို `npm install` / `next build` နဲ့ ကျွန်တော့်ဘက်က မ run ရသေးပါ (network ပိတ်ထားလို့) — code ကို type-level စစ်ထားပါတယ်။
