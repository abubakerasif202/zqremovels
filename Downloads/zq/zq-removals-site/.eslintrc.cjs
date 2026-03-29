module.exports = {
  extends: ['standard-with-typescript'],
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/space-before-function-paren': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    '@typescript-eslint/non-nullable-type-assertion-style': 'warn',
    'multiline-ternary': 'error',
    '@typescript-eslint/member-delimiter-style': 'error',
    '@typescript-eslint/semi': ['error', 'never']
  }
}
