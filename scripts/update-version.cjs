const { readFileSync, writeFileSync } = require('fs');

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
writeFileSync(
  './src/version.ts',
  `export const VERSION: string = "${pkg.version}";\n`,
  'utf8'
);
console.log(`Version updated to ${pkg.version}`);

