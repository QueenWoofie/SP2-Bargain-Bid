export const API_BASE = 'https://v2.api.noroff.dev';

export const ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    API_KEY: '/auth/create-api-key',
  },
  AUCTION: {
    LISTINGS: '/auction/listings',
    LISTING: (id) => `/auction/listings/${encodeURIComponent(id)}`,
    BIDS: (id) => `/auction/listings/${encodeURIComponent(id)}/bids`,
    PROFILES: '/auction/profiles',
    PROFILE: (name) => `/auction/profiles/${encodeURIComponent(name)}`,
    PROFILE_LISTINGS: (name) => `/auction/profiles/${encodeURIComponent(name)}/listings`,
    PROFILE_BIDS: (name) => `/auction/profiles/${encodeURIComponent(name)}/bids`,
    PROFILE_WINS: (name) => `/auction/profiles/${encodeURIComponent(name)}/wins`,
    SEARCH_LISTINGS: '/auction/listings/search',
    SEARCH_PROFILES: '/auction/profiles/search',
  },
};
