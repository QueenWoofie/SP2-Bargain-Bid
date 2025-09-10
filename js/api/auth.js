import { ENDPOINTS } from './constants.js';
import { httpGet, httpSend } from './http.js';
import { storage } from '../utils/storage.js';

/** REGISTER */
export async function register({
  name,
  email,
  password,
  bio,
  avatarUrl,
  avatarAlt,
  bannerUrl,
  bannerAlt,
}) {
  if (!/@stud\.noroff\.no$/i.test(email)) {
    throw new Error('Email must end with @stud.noroff.no');
  }

  const body = {
    name,
    email,
    password,
    ...(bio ? { bio } : {}),
    ...(avatarUrl ? { avatar: { url: avatarUrl, alt: avatarAlt || '' } } : {}),
    ...(bannerUrl ? { banner: { url: bannerUrl, alt: bannerAlt || '' } } : {}),
  };

  const res = await httpSend('POST', ENDPOINTS.AUTH.REGISTER, body, { headers: {} });
  return res?.data;
}

/** LOGIN */
export async function login({ email, password }) {
  const res = await httpSend('POST', ENDPOINTS.AUTH.LOGIN, { email, password }, { headers: {} });
  const user = res?.data || {};

  const accessToken = user.accessToken;
  if (!accessToken) throw new Error('No access token returned from login');

  // Save token
  storage.setToken(accessToken);

  const { accessToken: _omit, ...profileSansToken } = user;
  storage.setUser(profileSansToken);

  if (!storage.getApiKey()) {
    const key = await createApiKey('Auction App Key');
    if (key) storage.setApiKey(key);
  }

  return profileSansToken;
}

/** CREATE API KEY */
export async function createApiKey(name = 'Auction App Key') {
  const res = await httpSend('POST', ENDPOINTS.AUTH.API_KEY, { name }, {});
  const key = res?.data?.key || null;
  if (!key) throw new Error('API key creation failed');
  return key;
}

/** LOGOUT */
export function logout() {
  storage.clearAll();
  location.href = '/index.html';
}

export function getToken() {
  return storage.getToken();
}
export function getProfile() {
  return storage.getUser();
}
export function getApiKey() {
  return storage.getApiKey();
}
