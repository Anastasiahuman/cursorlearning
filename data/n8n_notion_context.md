# Контекст для интеграции Notion + n8n

## Текущая боль
Каждый понедельник PM тратит 1.5 часа на:
1. Выгрузку метрик из аналитики (JSON)
2. Ручное заполнение таблицы в Notion «Еженедельные метрики»
3. Написание summary для команды в Notion-страницу «Weekly Update»
4. Отправку саммари в Telegram-канал команды

## Notion-структура
- **Workspace**: LoyalBox Product
- **Database**: «Weekly Metrics» — таблица с колонками:
  - Week (date)
  - MAU (number)
  - DAU (number)
  - D1 Retention (number, %)
  - D7 Retention (number, %)
  - Avg Check (number, rub)
  - NPS (number)
  - Points Earned (number, mln)
  - Points Redeemed (number, mln)
  - Notes (text)
- **Page**: «Weekly Update» — страница с текстовым саммари за неделю

## Желаемый результат
n8n workflow который:
1. По расписанию (пн 9:00) дёргает API аналитики
2. Парсит JSON с метриками
3. Добавляет строку в Notion-таблицу
4. Генерирует текстовый саммари (через AI-ноду)
5. Обновляет Notion-страницу Weekly Update
6. Отправляет саммари в Telegram-канал

## Доступы
- Notion API: integration token (internal integration)
- Telegram Bot: через BotFather, канал @loyalbox_team
- Analytics API: GET /analytics/weekly-summary (Bearer token)

## Пример ответа Analytics API
```json
{
  "week": "2026-02-10",
  "mau": 142000,
  "dau": 38000,
  "retention_d1": 52.0,
  "retention_d7": 28.0,
  "avg_check": 1870,
  "nps": 34,
  "points_earned_mln": 4.6,
  "points_redeemed_mln": 3.1,
  "highlights": [
    "DAU вырос на 8% (новый онбординг)",
    "Redemption rate рекорд 66.5%",
    "NPS +2 пункта за счёт ускорения начисления баллов"
  ]
}
```
