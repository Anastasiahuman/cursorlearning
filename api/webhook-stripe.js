/**
 * Webhook Stripe: после успешной оплаты отправляем письмо с подтверждением и ссылкой на чат в Telegram.
 * Env в Vercel: STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, CONFIRMATION_FROM_EMAIL, TELEGRAM_CHAT_LINK.
 * В Stripe Dashboard: Developers → Webhooks → Add endpoint → URL: https://твой-домен.vercel.app/api/webhook-stripe, события: checkout.session.completed.
 */

import { createHmac } from 'crypto';

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function verifyStripeSignature(rawBody, signature, secret) {
  const parts = signature.split(',').reduce((acc, x) => {
    const [k, v] = x.split('=');
    acc[k] = v;
    return acc;
  }, {});
  const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
  return parts.v1 === expected;
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONFIRMATION_FROM_EMAIL || 'onboarding@resend.dev';
  const telegramLink = process.env.TELEGRAM_CHAT_LINK || '';

  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET not set');
    res.status(500).end();
    return;
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];
  if (!sig || !verifyStripeSignature(rawBody, sig, secret)) {
    console.error('Stripe webhook signature verification failed');
    res.status(400).end();
    return;
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    res.status(400).end();
    return;
  }

  if (event.type !== 'checkout.session.completed') {
    res.status(200).json({ received: true });
    return;
  }

  const session = event.data.object;
  const customerEmail = session.customer_email || session.customer_details?.email;
  if (!customerEmail) {
    console.error('No customer email in session');
    res.status(200).json({ received: true });
    return;
  }

  const chatLinkHtml = telegramLink
    ? `<p>Ссылка на чат интенсива в Telegram: <a href="${telegramLink}">${telegramLink}</a></p>`
    : '';

  const html = `
    <p>Здравствуйте!</p>
    <p>Оплата прошла успешно. Вы записаны на интенсив по Cursor для менеджеров.</p>
    ${chatLinkHtml}
    <p>До встречи на интенсиве!</p>
  `;

  if (resendKey) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendKey}`
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [customerEmail],
          subject: 'Вы записаны на интенсив — Cursor для менеджеров',
          html
        })
      });
      if (!r.ok) {
        const err = await r.text();
        console.error('Resend error:', r.status, err);
      }
    } catch (e) {
      console.error('Resend request error:', e);
    }
  }

  res.status(200).json({ received: true });
}
