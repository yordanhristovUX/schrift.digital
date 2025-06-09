import { AuthError } from '@supabase/supabase-js';
import i18next from 'i18next';

export function getAuthErrorMessage(error: AuthError | Error | null): string {
  if (!error) return '';

  // Handle specific Supabase auth errors
  if ('status' in error && error.status === 429) {
    return i18next.t('errors:auth.over_email_send_rate_limit');
  }

  // Check for Supabase error code first (more reliable)
  if ('code' in error && error.code) {
    switch (error.code) {
      case 'invalid_credentials':
        return i18next.t('errors:auth.invalid_credentials');
      case 'email_not_confirmed':
        return i18next.t('errors:auth.email_not_confirmed');
      case 'user_not_found':
        return i18next.t('errors:auth.user_not_found');
      case 'signup_disabled':
        return i18next.t('errors:auth.email_taken');
      case 'weak_password':
        return i18next.t('errors:auth.weak_password');
      case 'invalid_email':
        return i18next.t('errors:auth.invalid_email');
      case 'token_expired':
      case 'expired_token':
        return i18next.t('errors:auth.expired_token');
      case 'invalid_token':
        return i18next.t('errors:auth.invalid_token');
      case 'network_error':
        return i18next.t('errors:auth.network_error');
    }
  }

  // Try to parse JSON from error message if it contains stringified JSON
  let parsedErrorCode = null;
  try {
    const message = error.message;
    
    // First, try to parse the entire message as JSON (for structured error objects)
    try {
      const parsedMessage = JSON.parse(message);
      
      // Check if there's a 'body' field containing stringified JSON
      if (parsedMessage.body && typeof parsedMessage.body === 'string') {
        const bodyJson = JSON.parse(parsedMessage.body);
        if (bodyJson.code) {
          parsedErrorCode = bodyJson.code;
        }
      }
      // Check if the parsed message itself has a code
      else if (parsedMessage.code) {
        parsedErrorCode = parsedMessage.code;
      }
    } catch (e) {
      // If full JSON parsing fails, try to find JSON-like content in the message
      const jsonMatch = message.match(/\{[^}]*"code"[^}]*\}/);
      if (jsonMatch) {
        const parsedJson = JSON.parse(jsonMatch[0]);
        if (parsedJson.code) {
          parsedErrorCode = parsedJson.code;
        }
      }
    }
  } catch (e) {
    // If JSON parsing fails, continue with string-based parsing
  }

  // Handle parsed error code
  if (parsedErrorCode) {
    switch (parsedErrorCode) {
      case 'invalid_credentials':
        return i18next.t('errors:auth.invalid_credentials');
      case 'email_not_confirmed':
        return i18next.t('errors:auth.email_not_confirmed');
      case 'user_not_found':
        return i18next.t('errors:auth.user_not_found');
      case 'signup_disabled':
        return i18next.t('errors:auth.email_taken');
      case 'weak_password':
        return i18next.t('errors:auth.weak_password');
      case 'invalid_email':
        return i18next.t('errors:auth.invalid_email');
      case 'token_expired':
      case 'expired_token':
        return i18next.t('errors:auth.expired_token');
      case 'invalid_token':
        return i18next.t('errors:auth.invalid_token');
      case 'network_error':
        return i18next.t('errors:auth.network_error');
    }
  }

  // Fallback to message string parsing if code is not available or recognized
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