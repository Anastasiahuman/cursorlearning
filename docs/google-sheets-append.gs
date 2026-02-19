// Вставь этот код в Google Apps Script (Расширения → Apps Script в твоей таблице).
// Разверни как веб‑приложение (Развернуть → Новые развёртывания → Веб‑приложение, доступ: Все пользователи).
// URL развёртывания добавь в Vercel как GOOGLE_SHEETS_APPEND_URL.

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var body = e.postData ? JSON.parse(e.postData.contents) : {};
    var row = [
      body.name || '',
      body.email || '',
      body.phone || '',
      body.amount != null ? body.amount : '',
      body.paymentMethod || '',
      body.status || '',
      body.date || '',
      body.time || ''
    ];
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
