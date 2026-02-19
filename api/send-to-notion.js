/**
 * Vercel serverless: заявка с лендинга → Notion. Для опциональной интеграции при публикации сайта на GitHub Pages.
 * Env в Vercel: NOTION_API_KEY, NOTION_DATABASE_ID.
 */

const PAYMENT_LINKS = {
  stripe: { 9990: 'https://buy.stripe.com/6oU8wP1rwbtZfzW8w23F603', 24990: 'https://buy.stripe.com/8x25kD8TY8hN4Vi27E3F604' },
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

  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = (process.env.NOTION_DATABASE_ID || '30c59203544880e19b8af372b6c731d4').replace(/-/g, '');
  if (!apiKey) {
    res.status(500).json({ error: 'NOTION_API_KEY not set' });
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

  const payload = {
    parent: { database_id: databaseId },
    properties: {
      'Name': { title: [{ type: 'text', text: { content: (name || '—').slice(0, 2000) } }] },
      'Email': { email: email || null },
      'Phone': { phone_number: phone || null },
      'Сумма': { number: amount },
      'Status': { select: { name: statusLabel } },
      'Date': { date: { start: today } }
    }
  };

  try {
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION
      },
      body: JSON.stringify(payload)
    });
    if (!notionRes.ok) {
      const err = await notionRes.json();
      console.error('Notion error:', err);
    }
  } catch (e) {
    console.error('Notion request error:', e);
  }

  res.status(200).json({ redirectUrl });
}
