# Публикация сайта через Git (GitHub Pages)

Сайт лендинга публикуется **через Git** на **GitHub Pages** — без Netlify. Каждый `git push` в `main` обновляет сайт.

## Как опубликовать

1. Репозиторий **[Anastasiahuman/cursorlearning](https://github.com/Anastasiahuman/cursorlearning)** уже содержит лендинг в папке **cursor-intensive-landing/**.
2. На GitHub: **Settings** → **Pages** → **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/cursor-intensive-landing**
3. **Save**. Через 1–2 минуты сайт откроется по адресу:

   **https://anastasiahuman.github.io/cursorlearning/**

Подробнее: [GITHUB_PAGES.md](GITHUB_PAGES.md).

## Заявки в Notion (по желанию)

По умолчанию форма «Записаться» только ведёт на оплату. Чтобы заявки сохранялись в Notion, разверни функцию **api/send-to-notion.js** на [Vercel](https://vercel.com) и укажи её URL в лендинге — шаги в [GITHUB_PAGES.md](GITHUB_PAGES.md#заявки-в-notion-по-желанию).

Таблица Notion: [NOTION_SETUP.md](NOTION_SETUP.md).
