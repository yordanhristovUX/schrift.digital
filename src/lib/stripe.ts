import { supabase } from './supabase';

export interface CheckoutOptions {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  mode?: 'subscription' | 'payment';
}

export interface SubscriptionManagementOptions {
  action: 'cancel' | 'portal';
  returnUrl: string;
}

export const createCheckoutSession = async (options: CheckoutOptions) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_id: options.priceId,
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      mode: options.mode || 'subscription',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  const data = await response.json();
  return data.url;
};

export const manageSubscription = async (options: SubscriptionManagementOptions) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-subscription`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: options.action,
      return_url: options.returnUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to manage subscription');
  }

  const data = await response.json();
  return data.url;
};

export const getPrice = async (priceId?: string) => {
  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-price`);
  if (priceId) {
    url.searchParams.set('price_id', priceId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get price');
  }

  return response.json();
};

export const formatPrice = (amount: number, currency: string = 'eur') => {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};