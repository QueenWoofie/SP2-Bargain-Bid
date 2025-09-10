import { getToken } from '../api/auth.js';
import { storage } from './storage.js';

export function requireAuth(redirect = '/login.html') {
  if (!getToken() || !storage.getApiKey()) {
    location.href = redirect;
    return false;
  }
  return true;
}
