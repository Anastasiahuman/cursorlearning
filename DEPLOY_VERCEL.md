# Деплой на Vercel (сайт + Notion в одном проекте)

Один деплой: и лендинг, и сохранение заявок в Notion работают без отдельной настройки.

## Шаги

1. Зайди на **[vercel.com](https://vercel.com)** → **Add New** → **Project**.
2. Импортируй репозиторий **Anastasiahuman/cursorlearning** (GitHub).
3. Настройки сборки **не меняй** — в репозитории уже есть **vercel.json**:
   - лендинг копируется в выходную папку;
   - **api/send-to-notion.js** разворачивается как серверная функция.
4. В **Environment Variables** добавь (обязательно для Notion):
   - **NOTION_API_KEY** — токен интеграции Notion (из [Notion My integrations](https://www.notion.so/my-integrations));
   - **NOTION_DATABASE_ID** — `30c59203544880e19b8af372b6c731d4`.
5. Нажми **Deploy**.

После деплоя:
- Сайт открывается по адресу вида **https://cursorlearning-xxx.vercel.app**.
- Форма «Записаться» отправляет данные в Notion и перенаправляет на оплату.

Дальше каждый **git push** в `main` будет автоматически запускать новый деплой на Vercel.

---

**Через CLI (если удобнее):** `npx vercel login`, затем в папке репозитория `npx vercel --prod`. Переменные NOTION_API_KEY и NOTION_DATABASE_ID задай в проекте на vercel.com (Settings → Environment Variables).
