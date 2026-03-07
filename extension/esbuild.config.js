import esbuild from 'esbuild';
import { cpSync, mkdirSync } from 'fs';

const isWatch = process.argv.includes('--watch');

const commonConfig = {
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  target: 'es2020',
  format: 'esm',
};

async function build() {
  // Create dist directories
  mkdirSync('dist/popup', { recursive: true });
  mkdirSync('dist/background', { recursive: true });
  mkdirSync('dist/icons', { recursive: true });

  // Build popup
  await esbuild.build({
    ...commonConfig,
    entryPoints: ['src/popup/popup.ts'],
    outfile: 'dist/popup/popup.js',
  });

  // Build background service worker
  await esbuild.build({
    ...commonConfig,
    entryPoints: ['src/background/service-worker.ts'],
    outfile: 'dist/background/service-worker.js',
  });

  // Copy static files
  cpSync('src/popup/index.html', 'dist/popup/index.html');
  cpSync('src/popup/popup.css', 'dist/popup/popup.css');
  cpSync('manifest.json', 'dist/manifest.json');
  cpSync('icons', 'dist/icons', { recursive: true });

  console.log('Build complete');
}

if (isWatch) {
  const ctx = await esbuild.context({
    ...commonConfig,
    entryPoints: ['src/popup/popup.ts'],
    outfile: 'dist/popup/popup.js',
  });
  // Also build background once
  await esbuild.build({
    ...commonConfig,
    entryPoints: ['src/background/service-worker.ts'],
    outfile: 'dist/background/service-worker.js',
  });
  cpSync('src/popup/index.html', 'dist/popup/index.html');
  cpSync('src/popup/popup.css', 'dist/popup/popup.css');
  cpSync('manifest.json', 'dist/manifest.json');
  mkdirSync('dist/icons', { recursive: true });
  cpSync('icons', 'dist/icons', { recursive: true });
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await build();
}
