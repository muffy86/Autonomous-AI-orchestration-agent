module.exports = {
  // TypeScript and TypeScript React files
  '**/*.{ts,tsx}': (filenames) => [
    `pnpm exec biome lint --write ${filenames.join(' ')}`,
    `pnpm exec biome format --write ${filenames.join(' ')}`,
    `pnpm exec eslint --fix ${filenames.join(' ')}`,
    'pnpm exec tsc --noEmit --incremental false',
  ],

  // JavaScript files
  '**/*.{js,jsx}': (filenames) => [
    `pnpm exec biome lint --write ${filenames.join(' ')}`,
    `pnpm exec biome format --write ${filenames.join(' ')}`,
    `pnpm exec eslint --fix ${filenames.join(' ')}`,
  ],

  // JSON files
  '**/*.json': (filenames) => [
    `pnpm exec biome format --write ${filenames.join(' ')}`,
  ],

  // Markdown files
  '**/*.md': (filenames) => [
    `pnpm exec biome format --write ${filenames.join(' ')}`,
  ],

  // CSS/SCSS files
  '**/*.{css,scss}': (filenames) => [
    `pnpm exec biome format --write ${filenames.join(' ')}`,
  ],
};
