/**
 * Webhook ЮKassa: при успешной оплате (payment.succeeded) отправляем письмо с подтверждением и ссылкой на чат в Telegram.
 * Env в Vercel: RESEND_API_KEY, CONFIRMATION_FROM_EMAIL, TELEGRAM_CHAT_LINK (те же, что для Stripe).
 * В ЮKassa: Настройки → HTTP-уведомления → URL: https://твой-домен.vercel.app/api/webhook-yookassa, событие payment.succeeded.
 * В создании платежа (send-to-notion) в metadata передаётся customer_email и customer_name — они приходят в уведомлении.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONFIRMATION_FROM_EMAIL || 'onboarding@resend.dev';
  const telegramLink = process.env.TELEGRAM_CHAT_LINK || '';

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_) {
    res.status(400).end();
    return;
  }

  if (body.type !== 'notification' || body.event !== 'payment.succeeded') {
    res.status(200).json({ received: true });
    return;
  }

  const payment = body.object;
  if (!payment || payment.status !== 'succeeded') {
    res.status(200).json({ received: true });
    return;
  }

  const customerEmail = payment.metadata?.customer_email;
  if (!customerEmail) {
    console.error('YooKassa webhook: no customer_email in payment.metadata');
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
        console.error('Resend error (YooKassa):', r.status, err);
      }
    } catch (e) {
      console.error('Resend request error (YooKassa):', e);
    }
  } else {
    console.error('RESEND_API_KEY not set, cannot send confirmation email');
  }

  res.status(200).json({ received: true });
}
