// Central API base URLs. Read from REACT_APP_API_URL at build time.
// Local dev (env unset)  -> http://localhost:5000
// Vercel  (env set)      -> https://wedding-marketplace.onrender.com
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SERVER_BASE = API_BASE.replace(/\/api\/?$/, '');
