# LoyalBox API Documentation v2.3

## Base URL
```
https://api.loyalbox.ru/v2
```

## Authentication
All requests require Bearer token in header:
```
Authorization: Bearer {access_token}
```
Tokens expire in 24h. Refresh via `/auth/refresh`.

---

## Endpoints

### 1. User Profile

#### GET /users/{user_id}/profile
Returns user profile with loyalty tier info.

**Response 200:**
```json
{
  "user_id": "u_123456",
  "name": "Мария Иванова",
  "phone": "+7900*****45",
  "email": "m.ivanova@mail.ru",
  "tier": "silver",
  "tier_progress": {
    "current_spend": 45200,
    "next_tier_threshold": 60000,
    "remaining": 14800
  },
  "points_balance": 3420,
  "points_expiring": { "amount": 850, "date": "2026-03-01" },
  "registered_at": "2025-10-15T10:30:00Z",
  "last_activity": "2026-02-17T14:22:00Z"
}
```

#### PUT /users/{user_id}/profile
Updates user profile fields: `name`, `email`, `birth_date`, `preferences`.

---

### 2. Points & Transactions

#### GET /users/{user_id}/points/balance
Returns current points balance and pending transactions.

**Response 200:**
```json
{
  "balance": 3420,
  "pending": 150,
  "earned_this_month": 1280,
  "redeemed_this_month": 600,
  "expiring_soon": { "amount": 850, "date": "2026-03-01" }
}
```

#### POST /points/earn
Earn points from purchase. Called by POS system.

**Request:**
```json
{
  "user_id": "u_123456",
  "store_id": "s_045",
  "receipt_id": "r_789012",
  "amount_rub": 2350,
  "items": [
    { "sku": "milk_001", "name": "Молоко 3.2%", "price": 89, "qty": 2 },
    { "sku": "bread_005", "name": "Хлеб Бородинский", "price": 65, "qty": 1 }
  ]
}
```

**Response 201:**
```json
{
  "transaction_id": "t_456789",
  "points_earned": 117,
  "bonus_points": 50,
  "bonus_reason": "category_promo_dairy",
  "new_balance": 3587
}
```

#### POST /points/redeem
Redeem points at checkout.

**Request:**
```json
{
  "user_id": "u_123456",
  "store_id": "s_045",
  "receipt_id": "r_789013",
  "points_to_redeem": 500,
  "purchase_amount_rub": 1800
}
```

**Response 200:**
```json
{
  "transaction_id": "t_456790",
  "points_redeemed": 500,
  "discount_rub": 500,
  "final_amount_rub": 1300,
  "new_balance": 3087
}
```

**Error 400:**
```json
{
  "error": "INSUFFICIENT_POINTS",
  "message": "Недостаточно баллов. Доступно: 3087, запрошено: 5000"
}
```

**Error 400:**
```json
{
  "error": "REDEEM_LIMIT_EXCEEDED",
  "message": "Максимальное списание 30% от суммы чека (540 руб)"
}
```

---

### 3. Promotions

#### GET /promotions/active
Returns list of active promotions for the user.

**Query params:**
- `user_id` (required) — for personalization
- `store_id` (optional) — filter by store
- `category` (optional) — filter by product category

**Response 200:**
```json
{
  "promotions": [
    {
      "promo_id": "p_101",
      "title": "Двойные баллы на молочные продукты",
      "description": "Получайте x2 баллов за покупку молочных продуктов",
      "type": "category_bonus",
      "multiplier": 2,
      "category": "dairy",
      "start_date": "2026-02-15",
      "end_date": "2026-02-28",
      "image_url": "https://cdn.loyalbox.ru/promos/dairy_feb.jpg",
      "is_personal": false
    },
    {
      "promo_id": "p_102",
      "title": "Скидка 15% на ваши любимые товары",
      "description": "Персональная скидка на топ-5 товаров из вашей корзины",
      "type": "personal_discount",
      "discount_pct": 15,
      "applicable_skus": ["coffee_012", "cheese_007", "yogurt_003"],
      "start_date": "2026-02-10",
      "end_date": "2026-02-20",
      "is_personal": true
    }
  ]
}
```

#### POST /promotions/{promo_id}/activate
User explicitly activates a promotion (for personal offers).

---

### 4. Push Notifications

#### POST /notifications/send
Send push notification to user segment.

**Request:**
```json
{
  "title": "Ваши баллы скоро сгорят!",
  "body": "850 баллов истекают 1 марта. Используйте их при следующей покупке",
  "segment": "points_expiring_30d",
  "action": "deeplink://loyalbox/points",
  "schedule": "2026-02-18T10:00:00Z",
  "ttl_hours": 24
}
```

#### GET /notifications/stats/{campaign_id}
Returns push campaign delivery stats.

---

### 5. Referral Program

#### POST /referrals/generate
Generates referral link for user.

**Response 200:**
```json
{
  "referral_code": "MARIA2026",
  "referral_link": "https://loyalbox.ru/ref/MARIA2026",
  "reward_inviter": 500,
  "reward_invitee": 300,
  "max_referrals": 10,
  "used": 3
}
```

#### GET /referrals/{user_id}/stats
Returns referral performance for user.

---

### 6. Analytics (Internal)

#### GET /analytics/cohorts
Returns cohort retention data. Requires admin token.

#### GET /analytics/funnel
Returns funnel metrics. Supported funnels: `onboarding`, `first_purchase`, `referral`.

#### GET /analytics/segments
Returns user segment breakdown with key metrics.

---

## Webhooks

### Purchase completed
Fires when POS confirms purchase.
```json
{
  "event": "purchase.completed",
  "user_id": "u_123456",
  "store_id": "s_045",
  "amount_rub": 2350,
  "points_earned": 167,
  "timestamp": "2026-02-17T14:22:00Z"
}
```

### Tier changed
Fires when user reaches new loyalty tier.
```json
{
  "event": "tier.changed",
  "user_id": "u_123456",
  "old_tier": "silver",
  "new_tier": "gold",
  "timestamp": "2026-02-17T14:22:00Z"
}
```

### Points expiring
Fires 7 days before points expiration.
```json
{
  "event": "points.expiring",
  "user_id": "u_123456",
  "amount": 850,
  "expiry_date": "2026-03-01",
  "timestamp": "2026-02-22T09:00:00Z"
}
```

---

## Rate Limits
- Standard: 100 req/min per token
- Analytics endpoints: 10 req/min
- Bulk operations: 5 req/min

## Error Codes
| Code | Description |
|------|-------------|
| 400  | Bad request / validation error |
| 401  | Unauthorized / expired token |
| 403  | Forbidden / insufficient permissions |
| 404  | Resource not found |
| 429  | Rate limit exceeded |
| 500  | Internal server error |

## Changelog
- **v2.3** (Feb 2026): Added stories endpoints (coming soon), referral stats
- **v2.2** (Jan 2026): Push notification scheduling, segment targeting
- **v2.1** (Dec 2025): Personal promotions, tier progress
- **v2.0** (Oct 2025): Initial release
