// frontend/src/services/publicService.js - Public API calls (no auth required)

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Fetch the active landing page blocks
 * @returns {Promise<Object>} Landing page data with blocks array
 */
export const getLandingPage = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/public/landing`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch landing page');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching landing page:', error);
    throw error;
  }
};

export default {
  getLandingPage,
};
