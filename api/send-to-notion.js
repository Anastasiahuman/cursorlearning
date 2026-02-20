/**
 * Vercel serverless: по кнопке «Перейти к оплате» — сохраняем заявку в Google Таблицу, возвращаем ссылку на оплату.
 * Env: GOOGLE_SHEETS_APPEND_URL. Для ЮKassa с возвратом на нашу страницу «Спасибо»: YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY, SITE_URL (например https://cursorlearning.vercel.app).
 */

const PAYMENT_LINKS = {
  stripe: { 9990: 'https://buy.stripe.com/8x25kD8TY8hN4Vi27E3F604', 24990: 'https://buy.stripe.com/6oU8wP1rwbtZfzW8w23F603' },
  yookassa: { 9990: 'https://yookassa.ru/my/i/aY41DlTAd6Eb/l', 24990: 'https://yookassa.ru/my/i/aY41dCCrZdsy/l' }
};

async function createYooKassaPayment(amount, returnUrl, shopId, secretKey) {
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
      description: 'Интенсив Cursor для менеджеров'
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
  const amount = parseInt(body.amount, 10) === 24990 ? 24990 : 9990;
  const paymentMethod = body.paymentMethod === 'stripe' ? 'stripe' : 'yookassa';
  const statusLabel = body.status === 'оплачено' ? 'Оплачено' : 'Не оплачено';

  let redirectUrl = PAYMENT_LINKS[paymentMethod][amount] || PAYMENT_LINKS.yookassa[amount];
  if (paymentMethod === 'yookassa') {
    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    const siteUrl = (process.env.SITE_URL || '').replace(/\/$/, '');
    if (shopId && secretKey && siteUrl) {
      const returnUrl = `${siteUrl}/thanks.html`;
      const confirmationUrl = await createYooKassaPayment(amount, returnUrl, shopId, secretKey);
      if (confirmationUrl) redirectUrl = confirmationUrl;
    }
  }
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const time = now.toISOString().slice(11, 19);

  const leadRow = { name, email, phone, amount, paymentMethod, status: statusLabel, date: today, time };

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

  res.status(200).json({ redirectUrl });
}
