module.exports = {
  proseWrap: 'always',
  singleQuote: true,
  trailingComma: 'all',
  semi: false,
  overrides: [
    {
      files: 'packages/@TestStuff/angular/**',
      options: {
        semi: true,
      },
    },
  ],
}
