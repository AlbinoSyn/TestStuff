#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import esbuild from 'esbuild';
import babel from 'esbuild-plugin-babel';

const PROJ_ROOT = new URL('../', import.meta.url);
const PACKAGES_ROOT = new URL('./packages/', PROJ_ROOT);

async function buildBundle(srcFile, bundleFile, options = {}) {
  const { minify = true, standalone = '', plugins, target, format } = options;
  await esbuild.build({
    bundle: true,
    sourcemap: true,
    entryPoints: [srcFile],
    outfile: bundleFile,
    platform: 'browser',
    minify,
    keepNames: true,
    plugins,
    target,
    format,
  });

  const buildType = minify ? 'Minified' : '';
  console.log(chalk.green(`Built ${buildType} Bundle [${standalone}]:`), chalk.magenta(bundleFile));
}

async function buildAllBundles() {
  await fs.mkdir(new URL('./TestStuff/dist', PACKAGES_ROOT), { recursive: true });
  await fs.mkdir(new URL('./@TestStuff/locales/dist', PACKAGES_ROOT), { recursive: true });

  const bundleTasks = [
    buildBundle(
      './packages/TestStuff/index.mjs',
      './packages/TestStuff/dist/TestStuff.min.mjs',
      { standalone: 'TestStuff (ESM)', format: 'esm' },
    ),
    buildBundle(
      './packages/TestStuff/bundle-legacy.mjs',
      './packages/TestStuff/dist/TestStuff.legacy.min.js',
      {
        standalone: 'TestStuff (with polyfills)',
        target: 'es5',
        plugins: [babel({ /* babel config */ })],
      },
    ),
    buildBundle(
      './packages/TestStuff/bundle.mjs',
      './packages/TestStuff/dist/TestStuff.min.js',
      { standalone: 'TestStuff', format: 'iife' },
    ),
  ];

  const localesModules = await fs.opendir(new URL('./@TestStuff/locales/src/', PACKAGES_ROOT));
  for await (const dirent of localesModules) {
    if (dirent.isDirectory() || !dirent.name.endsWith('.js')) continue;
    const localeName = path.basename(dirent.name, '.js');
    bundleTasks.push(
      buildBundle(
        `./packages/@TestStuff/locales/src/${localeName}.js`,
        `./packages/@TestStuff/locales/dist/${localeName}.min.js`,
      ),
    );
  }

  await Promise.all(bundleTasks);
}

buildAllBundles().catch((err) => {
  console.error(chalk.red('Build failed:'), err);
  process.exit(1);
});
