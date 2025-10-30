import { build } from 'esbuild';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');
const srcEntry = path.resolve(projectRoot, 'src', 'index.ts');
const templatePath = path.resolve(projectRoot, 'templates', 'black.html');

async function ensureCleanDist() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
}

async function bundleScript() {
  await build({
    entryPoints: [srcEntry],
    outfile: path.resolve(distDir, 'black.js'),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    sourcemap: false,
  });
}

async function copyTemplate() {
  const template = await readFile(templatePath, 'utf8');
  await writeFile(path.resolve(distDir, 'black.html'), template, 'utf8');
}

async function run() {
  await ensureCleanDist();
  await Promise.all([bundleScript(), copyTemplate()]);
}

run().catch((error) => {
  console.error('Failed to build MCP client assets:', error);
  process.exitCode = 1;
});
