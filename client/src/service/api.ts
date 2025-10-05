import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
const baseURL = apiBase ? `${apiBase}/api` : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Accept-Language': 'en-US',
  },
  withCredentials: true,
});

export default api;

