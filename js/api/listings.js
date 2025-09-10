import { ENDPOINTS } from './constants.js';
import { httpGet, httpSend } from './http.js';

export async function listListings(query = {}) {
  return await httpGet(ENDPOINTS.AUCTION.LISTINGS, { query });
}

export async function searchListings(q, extra = {}) {
  return await httpGet(ENDPOINTS.AUCTION.SEARCH_LISTINGS, { query: { q, ...extra } });
}

export async function getListing(id, query = {}) {
  const res = await httpGet(ENDPOINTS.AUCTION.LISTING(id), { query });
  return res?.data;
}

export async function createListing(body) {
  const res = await httpSend('POST', ENDPOINTS.AUCTION.LISTINGS, body, {});
  return res?.data;
}

export async function updateListing(id, body) {
  const res = await httpSend('PUT', ENDPOINTS.AUCTION.LISTING(id), body, {});
  return res?.data;
}

export async function deleteListing(id) {
  await httpSend('DELETE', ENDPOINTS.AUCTION.LISTING(id), undefined, {});
  return true;
}

export async function placeBid(id, amount) {
  const res = await httpSend('POST', ENDPOINTS.AUCTION.BIDS(id), { amount: Number(amount) }, {});
  return res?.data;
}
