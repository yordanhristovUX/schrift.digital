import { AuthError } from '@supabase/supabase-js';
import i18next from 'i18next';

export function getAuthErrorMessage(error: AuthError | Error | null): string {
  if (!error) return '';

  // Handle specific Supabase auth errors
  if ('status' in error && error.status === 429) {
    return i18next.t('errors:auth.over_email_send_rate_limit');
  }

  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return i18next.t('errors:auth.invalid_credentials');
  }

  if (message.includes('email not confirmed')) {
    return i18next.t('errors:auth.email_not_confirmed');
  }

  if (message.includes('user not found')) {
    return i18next.t('errors:auth.user_not_found');
  }

  if (message.includes('already registered')) {
    return i18next.t('errors:auth.email_taken');
  }

  if (message.includes('weak password')) {
    return i18next.t('errors:auth.weak_password');
  }

  if (message.includes('invalid email')) {
    return i18next.t('errors:auth.invalid_email');
  }

  if (message.includes('expired')) {
    return i18next.t('errors:auth.expired_token');
  }

  if (message.includes('invalid token')) {
    return i18next.t('errors:auth.invalid_token');
  }

  if (message.includes('network')) {
    return i18next.t('errors:auth.network_error');
  }

  // Default error message
  return i18next.t('errors:auth.unknown');
}