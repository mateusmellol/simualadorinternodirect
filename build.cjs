const { execSync } = require('child_process');
const fs = require('fs');

// Limpa e recria public/
if (fs.existsSync('public')) fs.rmSync('public', { recursive: true });
fs.mkdirSync('public/js',    { recursive: true });
fs.mkdirSync('public/css',   { recursive: true });
fs.mkdirSync('public/fonts', { recursive: true });

// Copia index.html
fs.copyFileSync('index.html', 'public/index.html');

// Copia CSS
for (const f of fs.readdirSync('css')) {
  fs.copyFileSync(`css/${f}`, `public/css/${f}`);
}

// Copia fontes
for (const f of fs.readdirSync('fonts')) {
  fs.copyFileSync(`fonts/${f}`, `public/fonts/${f}`);
}

// Bundle via esbuild → public/js/simulador.js
execSync(
  'npx esbuild js/bootstrap.tsx --bundle --outfile=public/js/simulador.js --platform=browser --jsx=automatic --loader:.tsx=tsx --minify --alias:framer=./framer-stub.js',
  { stdio: 'inherit' }
);

console.log('Build concluído → public/');
