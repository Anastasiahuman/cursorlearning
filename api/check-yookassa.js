/**
 * Проверка настроек на проде (без секретов).
 * Открой в браузере: https://твой-домен.vercel.app/api/check-yookassa
 * yookassaApi: true — на проде подтянуты YOOKASSA_* и SITE_URL, оплата картой РФ идёт через API. false — используются статические ссылки.
 */

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const shopId = !!process.env.YOOKASSA_SHOP_ID;
  const secretKey = !!process.env.YOOKASSA_SECRET_KEY;
  const siteUrl = !!(process.env.SITE_URL && process.env.SITE_URL.trim());
  const yookassaApi = shopId && secretKey && siteUrl;
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    yookassaApi,
    timeInPayload: true,
    message: yookassaApi
      ? 'На проде используется API ЮKassa (return_url на thanks.html).'
      : 'На проде используются статические ссылки. Добавь YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY и SITE_URL в Vercel → Environment Variables и сделай Redeploy.'
  });
}
