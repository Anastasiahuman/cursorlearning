# Заявки в Google Таблицу

Самый надёжный способ сохранять заявки с лендинга — писать их в Google Таблицу через скрипт. Один раз настроил — всё летит в таблицу.

## Шаг 1. Создать таблицу

1. Открой [Google Таблицы](https://sheets.google.com) → **Создать** пустую таблицу.
2. В первой строке добавь заголовки (как удобно), например:  
   **Имя** | **Email** | **Телефон** | **Сумма** | **Способ оплаты** | **Статус** | **Дата** | **Время**
3. Назови лист, если нужно (по умолчанию «Лист 1»).

## Шаг 2. Добавить скрипт

1. В таблице: **Расширения** → **Apps Script**.
2. Удали весь код в редакторе и вставь код из файла [docs/google-sheets-append.gs](docs/google-sheets-append.gs) (или скопируй ниже).
3. Сохрани проект (Ctrl+S), название любое.

## Шаг 3. Развернуть как веб‑приложение

1. В Apps Script нажми **Развернуть** → **Новые развёртывания**.
2. Тип: **Веб‑приложение**.
3. Параметры (обязательно такие, иначе заявки с сайта не сохранятся — будет 401):
   - **Описание:** например «Приём заявок»
   - **Запуск от имени:** **Я** (именно «Я», не «Пользователь, открывающий приложение» — иначе при вызове с сервера Google вернёт 401)
   - **У кого есть доступ:** **Все пользователи**
4. Нажми **Развернуть**.
5. Скопируй **URL веб‑приложения** (вид примерно такой: `https://script.google.com/macros/s/xxxxx/exec`). Это и есть твой **GOOGLE_SHEETS_APPEND_URL**.

## Шаг 4. Добавить URL в Vercel

1. Vercel → проект **cursorlearning** → **Settings** → **Environment Variables**.
2. Добавь переменную:
   - **Name:** `GOOGLE_SHEETS_APPEND_URL`
   - **Value:** вставь URL из шага 3 (например `https://script.google.com/macros/s/xxxxx/exec`)
3. Сохрани и сделай **Redeploy** последнего деплоя.

Готово. После нажатия «Перейти к оплате» заявка сначала попадёт в таблицу, затем пользователь уйдёт на страницу оплаты.

---

## Код скрипта (если не используешь файл)

Вставь в редактор Apps Script:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var body = e.postData ? JSON.parse(e.postData.contents) : {};
    var time = body.time || '';
    if (!time) {
      var d = new Date();
      time = Utilities.formatDate(d, Session.getScriptTimeZone(), 'HH:mm:ss');
    }
    var row = [
      body.name || '',
      body.email || '',
      body.phone || '',
      body.amount != null ? body.amount : '',
      body.paymentMethod || '',
      body.status || '',
      body.date || '',
      time
    ];
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

Порядок колонок в таблице: **Имя, Email, Телефон, Сумма, Способ оплаты, Статус, Дата, Время.**

---

## Если в таблице не появляется «Время»

1. **Обнови скрипт в Google:** в Apps Script должен быть код с 8-й колонкой `time` (см. код выше — там есть `body.time` и восьмой элемент в `row`). Скопируй актуальный код из [docs/google-sheets-append.gs](docs/google-sheets-append.gs), сохрани и сделай **Развернуть** → **Управление развёртываниями** → карандаш у текущего развёртывания → **Версиния** → **Новая версия** → **Развернуть**.
2. **Проверь заголовки:** в первой строке таблицы должна быть 8-я колонка с заголовком **Время**.
3. **Проверь, что API отдаёт время:** в браузере открой DevTools → вкладка Network → отправь заявку → выбери запрос к `send-to-notion` → во вкладке Response в JSON должны быть поля `redirectUrl` и `debug`. В `debug.time` должно быть значение вида `ЧЧ:мм:сс`. Если `debug.time` есть, а в таблице времени нет — проблема в скрипте или развёртывании скрипта (шаг 1).
