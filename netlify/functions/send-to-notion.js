/**
 * Netlify Function: по кнопке «Перейти к оплате» — заявка в Google Таблицу, возврат ссылки на оплату.
 * Env: GOOGLE_SHEETS_APPEND_URL (URL веб‑приложения Apps Script). См. GOOGLE_SHEETS_SETUP.md.
 */

const PAYMENT_LINKS = {
  stripe: { 12900: 'https://buy.stripe.com/dRm28r0nsfKfafC8w23F606', 24990: 'https://buy.stripe.com/6oU8wP1rwbtZfzW8w23F603' },
  yookassa: { 12900: 'https://yookassa.ru/my/i/aZ3ErOIYnE14/l', 24990: 'https://yookassa.ru/my/i/aY41dCCrZdsy/l' }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (_) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const phone = (body.phone || '').trim();
  const amount = parseInt(body.amount, 10) === 24990 ? 24990 : 12900;
  const paymentMethod = body.paymentMethod === 'stripe' ? 'stripe' : 'yookassa';
  const statusLabel = body.status === 'оплачено' ? 'Оплачено' : 'Не оплачено';

  const redirectUrl = PAYMENT_LINKS[paymentMethod][amount] || PAYMENT_LINKS.yookassa[amount];
  const today = new Date().toISOString().split('T')[0];
  const leadRow = { name, email, phone, amount, paymentMethod, status: statusLabel, date: today };

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

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirectUrl })
  };
};
