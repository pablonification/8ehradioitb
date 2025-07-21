// Helper function for cache-busting fetch
export const noCacheFetch = (url, options = {}) => {
  return fetch(url, {
    ...options,
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      ...options.headers
    }
  });
};

// SWR fetcher with no cache
export const noCacheFetcher = (...args) => noCacheFetch(...args).then(res => res.json()); 