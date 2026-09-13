// Symbiosis/frontend/src/apiConfig.js

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    // Point to the new Render backend!
    return 'https://symbiosis-eco.onrender.com/api';
  } else {
    // This is for local development
    return 'http://localhost:8000/api';
  }
};

export const API_BASE_URL = getApiBaseUrl();