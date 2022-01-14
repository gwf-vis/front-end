import { Config } from '@stencil/core';

// https://stenciljs.com/docs/config

const devEnv = {
  SERVER_BASE_URL: 'http://localhost:5000',
};

const prodEnv = {
  SERVER_BASE_URL: '//backend',
};

export const config: Config = {
  globalScript: 'src/global/app.ts',
  globalStyle: 'src/global/app.css',
  taskQueue: 'async',
  outputTargets: [
    {
      type: 'www',
      serviceWorker: null,
    },
  ],
  env: process.env.NODE_ENV === 'dev' ? devEnv : prodEnv,
};
