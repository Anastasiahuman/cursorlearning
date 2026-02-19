# Деплой сайта через Git

Сайт лендинга деплоится через **Git**: подключаешь репозиторий к Netlify один раз — дальше каждый `git push` в `main` автоматически обновляет сайт. Заявки с формы сохраняются в **Notion**.

## Быстрый старт

1. **Netlify:** [netlify.com](https://netlify.com) → Add new site → Import from Git → репозиторий **Anastasiahuman/cursorlearning**.
2. **Не меняй** настройки сборки (всё в `netlify.toml`). Нажми **Deploy site**.
3. **Site configuration** → **Environment variables** → добавь:
   - `NOTION_API_KEY` — токен из [Notion My integrations](https://www.notion.so/my-integrations)
   - `NOTION_DATABASE_ID` — `30c59203544880e19b8af372b6c731d4`
4. **Deploys** → **Trigger deploy**, чтобы подхватить переменные.

После этого сайт живёт по адресу Netlify, а заявки пишутся в [таблицу Notion](https://www.notion.so/30c59203544880e19b8af372b6c731d4).

Подробно: [NETLIFY_DEPLOY.md](NETLIFY_DEPLOY.md) и [NOTION_SETUP.md](NOTION_SETUP.md).
