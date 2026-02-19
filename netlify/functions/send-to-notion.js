/**
 * Netlify Function: заявка с лендинга → Notion (таблица), возвращает ссылку на оплату.
 * Env: NOTION_API_KEY (Integration token), NOTION_DATABASE_ID (ID таблицы из URL).
 * Таблица в Notion должна содержать свойства: Имя (title), Email (email), Телефон (phone_number),
 * Сумма (number), Оплата (rich_text), Статус (select: "Не оплачено" / "Оплачено"), Дата (date).
 */

const PAYMENT_LINKS = {
  stripe: { 9990: 'https://buy.stripe.com/6oU8wP1rwbtZfzW8w23F603', 24990: 'https://buy.stripe.com/8x25kD8TY8hN4Vi27E3F604' },
  yookassa: { 9990: 'https://yookassa.ru/my/i/aY41DlTAd6Eb/l', 24990: 'https://yookassa.ru/my/i/aY41dCCrZdsy/l' }
};

const NOTION_VERSION = '2022-06-28';

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

  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID || '30c59203544880e19b8af372b6c731d4';
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'NOTION_API_KEY not set' })
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
  const amount = parseInt(body.amount, 10) === 24990 ? 24990 : 9990;
  const paymentMethod = body.paymentMethod === 'stripe' ? 'stripe' : 'yookassa';
  const statusLabel = body.status === 'оплачено' ? 'Оплачено' : 'Не оплачено';

  const redirectUrl = PAYMENT_LINKS[paymentMethod][amount] || PAYMENT_LINKS.yookassa[amount];
  const today = new Date().toISOString().split('T')[0];

  const paymentLabel = paymentMethod === 'stripe' ? 'Stripe (иностранная карта)' : 'ЮKassa (карта РФ)';
  const payload = {
    parent: { database_id: databaseId.replace(/-/g, '') },
    properties: {
      'Имя': {
        title: [{ type: 'text', text: { content: (name || '—').slice(0, 2000) } }]
      },
      'Email': {
        email: email || null
      },
      'Телефон': {
        phone_number: phone || null
      },
      'Сумма': {
        number: amount
      },
      'Оплата': {
        rich_text: [{ type: 'text', text: { content: paymentLabel.slice(0, 2000) } }]
      },
      'Статус': {
        select: { name: statusLabel }
      },
      'Дата': {
        date: { start: today }
      }
    }
  };

  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': NOTION_VERSION
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Notion API error:', data);
      return {
        statusCode: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.message || 'Notion error', redirectUrl })
      };
    }
  } catch (e) {
    console.error('Notion request error:', e);
  }

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirectUrl })
  };
};
