# Письмо после оплаты: подтверждение + ссылка на чат в Telegram

После успешной оплаты (Stripe) пользователю автоматически уходит письмо с текстом «Вы записаны на интенсив» и ссылкой на чат в Telegram.

## Что уже сделано в коде

- Обработчик **`/api/webhook-stripe`** принимает webhook от Stripe и при событии `checkout.session.completed` отправляет письмо через Resend.

## Шаг 1. Resend (отправка писем)

1. Зарегистрируйся на [resend.com](https://resend.com).
2. В разделе **API Keys** создай ключ, скопируй его.
3. В **Vercel** → проект → **Settings** → **Environment Variables** добавь:
   - **RESEND_API_KEY** — вставь ключ из Resend.
   - **CONFIRMATION_FROM_EMAIL** — с какого адреса слать (например `noreply@твой-домен.com`). Для теста можно оставить `onboarding@resend.dev` (тогда письма придут с пометкой Resend).
   - **TELEGRAM_CHAT_LINK** — ссылка на чат интенсива в Telegram (например `https://t.me/joinchat/xxxxx` или инвайт-ссылка группы).

## Шаг 2. Stripe Webhook

1. Зайди в [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**.
2. **Add endpoint**.
3. **Endpoint URL:** `https://твой-домен.vercel.app/api/webhook-stripe` (подставь свой домен из Vercel).
4. **Events to send:** выбери **checkout.session.completed** (или «Select events» и найди это событие).
5. Нажми **Add endpoint**.
6. Открой созданный endpoint и в разделе **Signing secret** нажми **Reveal** и скопируй значение (начинается с `whsec_`).
7. В **Vercel** → **Environment Variables** добавь:
   - **STRIPE_WEBHOOK_SECRET** — вставь этот `whsec_...` секрет.

## Шаг 3. Redeploy

В Vercel сделай **Redeploy** последнего деплоя, чтобы подхватились новые переменные и функция `api/webhook-stripe.js`.

## Проверка

Сделай тестовую оплату (Stripe Test mode) и убедись, что на email плательщика пришло письмо с подтверждением и ссылкой на чат. В Stripe → Webhooks можно смотреть доставку событий и ответ (200 = ок).

## ЮKassa

Для автоматического письма после оплаты через ЮKassa нужен отдельный webhook (у ЮKassa свой формат событий). Можно добавить позже по аналогии: endpoint `/api/webhook-yookassa`, переменная для секрета/подписи, отправка письма при успешной оплате.
