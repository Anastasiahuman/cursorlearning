# Деплой лендинга через Git (Netlify) + Notion

Один раз подключаешь репозиторий к Netlify — дальше каждый `git push` автоматически обновляет сайт. Заявки с формы сохраняются в таблицу Notion.

---

## Шаг 1. Подключить репозиторий к Netlify

1. Зайди на **[netlify.com](https://netlify.com)** → войди в аккаунт.
2. **Add new site** → **Import an existing project**.
3. Выбери **GitHub** и репозиторий **Anastasiahuman/cursorlearning**.
4. Настройки сборки **не меняй** (всё задано в `netlify.toml`):
   - **Build command:** пусто
   - **Publish directory:** `cursor-intensive-landing`
   - **Functions directory:** `netlify/functions`
5. Нажми **Deploy site**. Первый деплой подтянет лендинг из Git.

---

## Шаг 2. Переменные для Notion (обязательно)

Без них заявки в Notion не попадут.

1. В Netlify: твой сайт → **Site configuration** → **Environment variables** → **Add a variable** / **Add from .env**.
2. Добавь две переменные:

| Имя | Значение | Видимость |
|-----|----------|-----------|
| `NOTION_API_KEY` | Токен интеграции Notion (начинается с `ntn_` или `secret_`) | All |
| `NOTION_DATABASE_ID` | `30c59203544880e19b8af372b6c731d4` | All |

3. Сохрани. Потом: **Deploys** → **Trigger deploy** → **Deploy site**, чтобы новый деплой подхватил переменные.

Токен берётся из [Notion → My integrations](https://www.notion.so/my-integrations). Таблица должна быть расшарена с этой интеграцией (⋯ → Connections → выбрать интеграцию).

---

## Шаг 3. Как это работает дальше

- Ты пушишь в **main** репозитория **cursorlearning** → Netlify сам делает новый деплой и подтягивает изменения.
- Лендинг открывается по адресу вида `https://<имя-сайта>.netlify.app`.
- Кнопка «Записаться» открывает форму (имя, email, телефон, способ оплаты). После отправки:
  - в Notion создаётся строка в таблице (Name, Email, Phone, Сумма, Status, Date);
  - пользователь перенаправляется на оплату (Stripe или ЮKassa).

Таблица Notion: [30c59203544880e19b8af372b6c731d4](https://www.notion.so/30c59203544880e19b8af372b6c731d4). Колонки: **Name**, **Email**, **Phone**, **Сумма**, **Status**, **Date**. Подробнее — в [NOTION_SETUP.md](NOTION_SETUP.md).

---

## Если что-то не так

- **Сайт не открывается:** в **Deploys** посмотри лог последнего деплоя; убедись, что в репо есть папка `cursor-intensive-landing` с `index.html` и картинками.
- **Заявки не попадают в Notion:** проверь, что в Netlify заданы `NOTION_API_KEY` и `NOTION_DATABASE_ID`, таблица расшарена с интеграцией, после смены переменных сделан **Trigger deploy**.
