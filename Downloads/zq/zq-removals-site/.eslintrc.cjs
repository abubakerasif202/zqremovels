module.exports = {
  extends: ['standard-with-typescript'],
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/space-before-function-paren': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    'multiline-ternary': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/semi': 'off'
  }
}
