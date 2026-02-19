# Публикация сайта на GitHub (GitHub Pages)

Сайт лендинга публикуется **через Git** на **GitHub Pages** — без Netlify. После настройки каждый `git push` в `main` обновляет сайт.

---

## Включить GitHub Pages

1. Открой репозиторий **[Anastasiahuman/cursorlearning](https://github.com/Anastasiahuman/cursorlearning)** на GitHub.
2. **Settings** → в левом меню **Pages**.
3. В блоке **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / **(root)**
   - **Folder:** **/cursor-intensive-landing**
4. Нажми **Save**.

Через 1–2 минуты сайт будет доступен по адресу:

**https://anastasiahuman.github.io/cursorlearning/**

(Если репозиторий под организацией или другой учёткой — замени `anastasiahuman` на свой логин.)

---

## Как обновлять сайт

Просто пуши изменения в ветку `main`:

```bash
git add .
git commit -m "Обновление лендинга"
git push origin main
```

GitHub сам пересоберёт Pages. Обновление может занять 1–2 минуты.

---

## Заявки в Notion (по желанию)

На GitHub Pages нет серверного кода, поэтому по умолчанию форма «Записаться» только перенаправляет на оплату (Stripe/ЮKassa), **без сохранения в Notion**.

Чтобы заявки попадали в Notion:

1. Зайди на [vercel.com](https://vercel.com) → **Add New** → **Project** → импортируй репозиторий **Anastasiahuman/cursorlearning**.
2. В **Environment Variables** добавь `NOTION_API_KEY` и `NOTION_DATABASE_ID` (значения из [NOTION_SETUP.md](NOTION_SETUP.md)).
3. Деплой — Vercel подхватит папку **api/** и развернёт функцию. Скопируй URL проекта (например `https://cursorlearning-xxx.vercel.app`).
4. В репозитории в файлах **cursor-intensive-landing/index.html** и **cursor-intensive.html** замени  
   `window.PAYMENT_API_URL = '';`  
   на  
   `window.PAYMENT_API_URL = 'https://твой-проект.vercel.app/api/send-to-notion';`
5. Закоммить и запушь — форма на GitHub Pages будет отправлять заявки в Notion через Vercel.

Подробнее про таблицу Notion: [NOTION_SETUP.md](NOTION_SETUP.md).
