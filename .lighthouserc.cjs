const path = require('path');

const chromeUserDataDir = path.join(__dirname, '.lhci-chrome').replace(/\\/g, '/');

module.exports = {
  ci: {
    collect: {
      staticDistDir: './site-dist',
      url: ['/', '/contact-us/', '/removalists-adelaide/'],
      numberOfRuns: 1,
      settings: {
        chromeFlags: `--user-data-dir=${chromeUserDataDir} --disable-gpu --no-sandbox`,
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
