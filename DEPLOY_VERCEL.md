# Деплой на Vercel (сайт + заявки в Google Таблицу)

Один деплой: лендинг, по кнопке «Перейти к оплате» заявка сохраняется в Google Таблицу, затем редирект на оплату.

## Переменная окружения (Vercel → Settings → Environment Variables)

| Переменная | Описание |
|------------|----------|
| **GOOGLE_SHEETS_APPEND_URL** | URL веб‑приложения Google Apps Script. С ним заявки пишутся в таблицу. Настройка: [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md). |

Без переменной редирект на оплату работает, заявки никуда не сохраняются.

---

## Шаги деплоя

1. Зайди на **[vercel.com](https://vercel.com)** → **Add New** → **Project**.
2. Импортируй репозиторий **Anastasiahuman/cursorlearning** (GitHub).
3. **Root Directory** оставь пустым (корень репозитория).
4. В **Environment Variables** добавь **GOOGLE_SHEETS_APPEND_URL** (URL из [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md)).
5. Нажми **Deploy**.

После деплоя:
- Сайт по адресу вида **https://cursorlearning-xxx.vercel.app**.
- По кнопке «Перейти к оплате» заявка сохраняется в Google Таблицу и открывается страница оплаты.

---

## Отбивка после оплаты: «Вы записаны на вебинар»

Чтобы после оплаты человек видел подтверждение:

1. **Страница «Вы записаны»** уже есть: **`/thanks.html`** (например `https://твой-домен.vercel.app/thanks.html`).

2. **Настрой success URL в платёжках:**
   - **Stripe:** [Dashboard](https://dashboard.stripe.com) → Payment Links → нужная ссылка → **After payment** → Success URL: `https://твой-домен.vercel.app/thanks.html`
   - **ЮKassa:** в настройках формы/ссылки оплаты укажи **Return URL** (куда вернуть после успеха): `https://твой-домен.vercel.app/thanks.html`

3. **Письмо «вы записаны»** (по желанию):
   - **Stripe** может отправлять письмо-чек после оплаты: в настройках Payment Link включи **Customer email** и при необходимости настрой шаблон.
   - Либо настрой webhook Stripe (событие `checkout.session.completed`) и отправляй своё письмо через Resend/SendGrid — это уже отдельный шаг.

**Через CLI:** `npx vercel login`, затем в папке репозитория `npx vercel --prod`. Переменные задай в проекте на vercel.com (Settings → Environment Variables).
