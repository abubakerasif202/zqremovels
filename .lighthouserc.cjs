const path = require('path');

module.exports = {
  ci: {
    collect: {
      staticDistDir: './site-dist',
      url: ['http://localhost/', 'http://localhost/contact-us/'],
      numberOfRuns: 1,
      chromePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      settings: {
        chromeFlags: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          `--user-data-dir=${path.resolve('./tmp/lhci-chrome')}`,
        ],
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'lcp-lazy-loaded': 'off',
        'non-composited-animations': 'off',
        'prioritize-lcp-image': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
