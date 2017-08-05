module.exports = {
  extends: [
    'anvilabs',
    'anvilabs/babel',
    'anvilabs/flowtype',
    'anvilabs/lodash',
  ],
  rules: {
    'no-underscore-dangle': 'off',
  },
  overrides: [
    Object.assign(
      {
        files: ['**/__tests__/*-test.js', '**/__mocks__/*.js'],
      },
      require('eslint-config-anvilabs/jest') // eslint-disable-line global-require, import/no-extraneous-dependencies, prettier/prettier
    ),
  ],
};
