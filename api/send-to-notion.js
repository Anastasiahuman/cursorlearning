/**
 * Vercel serverless: заявка с лендинга → сохраняем куда настроено, возвращаем ссылку на оплату.
 * Env в Vercel (хотя бы один для сохранения заявок):
 *   FORMSPREE_ENDPOINT — https://formspree.io/f/xxxxx (быстро, без кода: заявки в кабинете + на почту)
 *   NOTION_API_KEY + NOTION_DATABASE_ID — запись в Notion
 * Если ничего не задано — редирект на оплату всё равно работает.
 */

const PAYMENT_LINKS = {
  stripe: { 9990: 'https://buy.stripe.com/8x25kD8TY8hN4Vi27E3F604', 24990: 'https://buy.stripe.com/6oU8wP1rwbtZfzW8w23F603' },
  yookassa: { 9990: 'https://yookassa.ru/my/i/aY41DlTAd6Eb/l', 24990: 'https://yookassa.ru/my/i/aY41dCCrZdsy/l' }
};

const NOTION_VERSION = '2022-06-28';

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

  const redirectUrl = PAYMENT_LINKS[paymentMethod][amount] || PAYMENT_LINKS.yookassa[amount];
  const today = new Date().toISOString().split('T')[0];

  // 1) Formspree — один URL, заявки в кабинете и на почту
  const formspreeUrl = process.env.FORMSPREE_ENDPOINT;
  if (formspreeUrl) {
    try {
      const formspreeRes = await fetch(formspreeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          amount: String(amount),
          paymentMethod,
          status: statusLabel,
          date: today,
          _subject: 'Заявка: Cursor интенсив'
        })
      });
      if (!formspreeRes.ok) console.error('Formspree save failed:', formspreeRes.status);
    } catch (e) {
      console.error('Formspree request error:', e);
    }
  }

  // 2) Notion — сохраняем заявку перед редиректом на оплату
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = (process.env.NOTION_DATABASE_ID || '30c59203544880e19b8af372b6c731d4').replace(/-/g, '');
  if (apiKey) {
    const titleProp = { 'Name': { title: [{ type: 'text', text: { content: (name || '—').slice(0, 2000) } }] };
    const baseProps = {
      ...titleProp,
      'Email': { email: email || null },
      'Phone': { phone_number: phone || null },
      'Сумма': { number: amount },
      'Date': { date: { start: today } }
    };
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION
    };
    const tryNotion = async (properties) => {
      const res = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ parent: { database_id: databaseId }, properties })
      });
      const err = res.ok ? null : await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, err };
    };
    try {
      let result = await tryNotion({ ...baseProps, 'Status': { status: { name: statusLabel } } });
      if (!result.ok && result.err?.code === 'validation_error') {
        const msg = (result.err?.message || '').toLowerCase();
        if (msg.includes('status')) {
          result = await tryNotion({ ...baseProps, 'Status': { select: { name: statusLabel } } });
        }
        if (!result.ok && result.err?.code === 'validation_error') {
          result = await tryNotion(baseProps);
        }
        if (!result.ok && result.err?.code === 'validation_error') {
          result = await tryNotion({ ...titleProp, 'Date': { date: { start: today } } });
        }
      }
      if (!result.ok) {
        console.error('Notion save failed', result.status, JSON.stringify(result.err));
      }
    } catch (e) {
      console.error('Notion request error:', e);
    }
  }

  res.status(200).json({ redirectUrl });
}
