import { build } from 'esbuild';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');
const templateNames = ['black.html', 'homeflow.html', 'homeflow.js'];
const templatePaths = templateNames.map((name) => path.resolve(projectRoot, 'templates', name));

async function ensureCleanDist() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
}

async function bundleBlackWidget() {
  const entry = path.resolve(projectRoot, 'src', 'index.ts');
  const outfile = path.resolve(distDir, 'black.js');
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    sourcemap: false,
  });
}

async function copyTemplates() {
  await Promise.all(
    templatePaths.map(async (templatePath, index) => {
      const content = await readFile(templatePath, 'utf8');
      await writeFile(path.resolve(distDir, templateNames[index]), content, 'utf8');
    }),
  );
}

async function run() {
  await ensureCleanDist();
  await bundleBlackWidget();
  await copyTemplates();
}

run().catch((error) => {
  console.error('Failed to build MCP client assets:', error);
  process.exitCode = 1;
});
