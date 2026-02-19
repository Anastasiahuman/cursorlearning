# Деплой на Vercel (сайт + заявки в одном проекте)

Один деплой: лендинг, сохранение заявок (Notion и/или Formspree), редирект на оплату.

## Переменные окружения (Vercel → Settings → Environment Variables)

| Переменная | Обязательно | Описание |
|------------|-------------|----------|
| **NOTION_API_KEY** | Нет | Токен интеграции Notion ([My integrations](https://www.notion.so/my-integrations)). Нужен, если храните заявки в Notion. |
| **NOTION_DATABASE_ID** | Нет | ID таблицы (из URL страницы Notion). По умолчанию в коде: `30c59203544880e19b8af372b6c731d4`. |
| **FORMSPREE_ENDPOINT** | Нет | URL формы Formspree (`https://formspree.io/f/xxxxx`) — заявки в кабинете и на почту. |

Хотя бы один способ сохранения (Notion или Formspree) имеет смысл задать. Редирект на оплату работает в любом случае.

Подробнее про Notion: [NOTION_SETUP.md](NOTION_SETUP.md).

---

## Шаги деплоя

1. Зайди на **[vercel.com](https://vercel.com)** → **Add New** → **Project**.
2. Импортируй репозиторий **Anastasiahuman/cursorlearning** (GitHub).
3. **Root Directory** оставь пустым (корень репозитория).
4. В **Environment Variables** добавь нужные переменные (см. таблицу выше).
5. Нажми **Deploy**.

После деплоя:
- Сайт по адресу вида **https://cursorlearning-xxx.vercel.app**.
- Форма «Записаться» сохраняет заявку (Notion/Formspree) и перенаправляет на оплату.

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
