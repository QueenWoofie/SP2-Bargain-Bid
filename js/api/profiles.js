import { ENDPOINTS } from './constants.js';
import { httpGet, httpSend } from './http.js';

export async function getProfileByName(name, query = {}) {
  const res = await httpGet(ENDPOINTS.AUCTION.PROFILE(name), { query });
  return res?.data;
}

/** Update profile */
export async function updateProfile(name, body) {
  const res = await httpSend('PUT', ENDPOINTS.AUCTION.PROFILE(name), body, {});
  return res?.data;
}

export async function getListingsByProfile(name, query = {}) {
  return await httpGet(ENDPOINTS.AUCTION.PROFILE_LISTINGS(name), { query });
}
export async function getWinsByProfile(name, query = {}) {
  return await httpGet(ENDPOINTS.AUCTION.PROFILE_WINS(name), { query });
}
export async function getBidsByProfile(name, query = {}) {
  return await httpGet(ENDPOINTS.AUCTION.PROFILE_BIDS(name), { query });
}
