export const PRODUCTS = {
  PREMIUM: {
    id: 'prod_premium_schrift',
    priceId: 'price_1RT3whAJ880fjAKxqmrh4Iej', // Your actual price ID
    name: 'Schrift.Digital Premium',
    description: '1 month of Schrift.Digital Premium plan for €2.00',
    price: 200, // 2.00 EUR in cents
    currency: 'eur',
    mode: 'subscription' as const,
  },
} as const;