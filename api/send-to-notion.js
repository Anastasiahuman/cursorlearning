/**
 * Vercel serverless: по кнопке «Перейти к оплате» — сохраняем заявку в Google Таблицу, возвращаем ссылку на оплату.
 * Env: GOOGLE_SHEETS_APPEND_URL. Для ЮKassa с возвратом на нашу страницу «Спасибо»: YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY, SITE_URL (например https://cursorlearning.vercel.app).
 */

const PAYMENT_LINKS = {
  stripe: { 12900: 'https://buy.stripe.com/dRm28r0nsfKfafC8w23F606' },
  yookassa: { 12900: 'https://yookassa.ru/my/i/aZ3ErOIYnE14/l' }
};

async function createYooKassaPayment(amount, returnUrl, shopId, secretKey, metadata = {}) {
  const idempotenceKey = `cursor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const auth = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
  const r = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'Idempotence-Key': idempotenceKey
    },
    body: JSON.stringify({
      amount: { value: amount.toFixed(2), currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: returnUrl },
      description: 'Интенсив Cursor для менеджеров',
      metadata: metadata
    })
  });
  if (!r.ok) {
    const err = await r.text();
    console.error('YooKassa create payment failed:', r.status, err);
    return null;
  }
  const data = await r.json();
  return data.confirmation?.confirmation_url || null;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_) {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const phone = (body.phone || '').trim();
  const amount = parseInt(body.amount, 10) === 12900 ? 12900 : 12900;
  const paymentMethod = body.paymentMethod === 'stripe' ? 'stripe' : 'yookassa';
  const statusLabel = body.status === 'оплачено' ? 'Оплачено' : 'Не оплачено';

  let redirectUrl = PAYMENT_LINKS[paymentMethod][12900] || PAYMENT_LINKS.yookassa[12900];
  let yookassaSource = 'link';
  if (paymentMethod === 'yookassa') {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
    if (shopId && secretKey && siteUrl) {
      const returnUrl = `${siteUrl}/thanks.html`;
      const metadata = {};
      if (email) metadata.customer_email = email;
      if (name) metadata.customer_name = name;
      const confirmationUrl = await createYooKassaPayment(amount, returnUrl, shopId, secretKey, metadata);
      if (confirmationUrl) {
        redirectUrl = confirmationUrl;
        yookassaSource = 'api';
      }
    }
  }
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const time = now.toISOString().slice(11, 19);

  const leadRow = { name, email, phone, amount, paymentMethod, status: statusLabel, date: today, time };

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/4f9ebcc9-dd0e-4880-ae59-484401268db7', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'send-to-notion.js:leadRow', message: 'payload to Sheets', data: { leadRow, hasTime: !!leadRow.time }, timestamp: Date.now(), hypothesisId: 'time-in-payload' }) }).catch(() => {});
  fetch('http://127.0.0.1:7243/ingest/4f9ebcc9-dd0e-4880-ae59-484401268db7', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'send-to-notion.js:yookassa', message: 'yookassa source', data: { paymentMethod, yookassaSource }, timestamp: Date.now(), hypothesisId: 'yookassa-api-vs-link' }) }).catch(() => {});
  // #endregion

  const sheetsUrl = process.env.GOOGLE_SHEETS_APPEND_URL;
  if (sheetsUrl) {
    try {
      const sheetsRes = await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadRow)
      });
      if (!sheetsRes.ok) {
        console.error('Google Sheets append failed:', sheetsRes.status, await sheetsRes.text().catch(() => ''));
      }
    } catch (e) {
      console.error('Google Sheets request error:', e);
    }
  }

  res.setHeader('X-Yookassa-Source', yookassaSource);
  res.status(200).json({
    redirectUrl,
    debug: { time: leadRow.time, date: leadRow.date, yookassaSource: paymentMethod === 'yookassa' ? yookassaSource : null }
  });
}
