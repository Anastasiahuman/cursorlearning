# Публикация лендинга на Netlify

## 1. Подключение репозитория

- Зайдите на [netlify.com](https://netlify.com) → Add new site → Import an existing project.
- Подключите репозиторий (GitHub/GitLab) с этим проектом. Корень репозитория — папка с `netlify.toml`.

## 2. Настройки сборки (уже в netlify.toml)

- **Publish directory:** `cursor-intensive-landing` (указано в netlify.toml).
- **Build command:** оставьте пустым (сборка не нужна).
- **Functions directory:** `netlify/functions` (для отправки заявок в Telegram).

## 3. Переменные окружения

В Netlify: **Site settings → Environment variables** добавьте:

| Переменная             | Значение | Описание                          |
|------------------------|----------|-----------------------------------|
| `TELEGRAM_BOT_TOKEN`   | ваш токен бота | Токен от @BotFather              |
| `TELEGRAM_CHAT_ID`     | ваш chat_id   | Узнать: напишите боту, затем `node get-telegram-chat-id.js` |

## 4. Деплой

- Нажмите **Deploy site**. Главная страница сайта = `index.html` (лендинг).
- После деплоя форма «Записаться» будет отправлять данные в Telegram и перенаправлять на оплату (функция `/.netlify/functions/send-telegram`).

## Если деплой падает

- Убедитесь, что в репозитории есть папка **cursor-intensive-landing** с файлами: `index.html`, `cursor-intensive.html`, `vasilisa.jpeg`, `anastasia.jpeg`, `cursor-logo.png`, `claude-logo.png`.
- В логах Netlify смотрите ошибку: Build → Deploy log. Частая причина — неверный путь в **Publish directory** (должно быть ровно `cursor-intensive-landing`).
