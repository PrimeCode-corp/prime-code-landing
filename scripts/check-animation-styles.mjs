import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// Verificar el resultado de Tailwind: una clase desconocida no falla el build de Astro.
const directory = resolve(process.argv[2] ?? 'dist');

async function filesIn(folder) {
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else files.push(path);
  }
  return files;
}

const files = await filesIn(directory);
const htmlFiles = files.filter(file => file.endsWith('.html'));
const cssFiles = files.filter(file => file.endsWith('.css'));
if (htmlFiles.length === 0 || cssFiles.length === 0) {
  throw new Error('No se encontró el HTML o el CSS compilado para verificar las animaciones.');
}

const html = (await Promise.all(htmlFiles.map(file => readFile(file, 'utf8')))).join('\n');
const css = (await Promise.all(cssFiles.map(file => readFile(file, 'utf8')))).join('\n');
const animations = new Map();
for (const match of html.matchAll(/\bclass\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
  for (const token of (match[1] ?? match[2] ?? match[3]).split(/\s+/)) {
    const name = token.split(':').at(-1).match(/^animate-(?!delay-)([a-zA-Z][\w-]*)$/)?.[1];
    if (name && name !== 'none') animations.set(token, name);
  }
}

const keyframes = new Set([...css.matchAll(/@(?:-webkit-)?keyframes\s+([\w-]+)/g)].map(match => match[1]));
const variables = new Map([...css.matchAll(/--animate-([\w-]+)\s*:\s*([^;{}]+)/g)].map(match => [match[1], match[2]]));
const keywords = new Set(['none', 'initial', 'inherit', 'unset', 'revert', 'revert-layer', 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end']);
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const failures = [];

for (const [token, name] of animations) {
  const selector = token.replace(/[^a-zA-Z0-9_-]/g, character => '\\' + character);
  if (!new RegExp('\\.' + escapeRegExp(selector) + '(?![\\w-])').test(css)) {
    failures.push(`${token}: falta la clase en el CSS generado`);
  }
  const animationName = variables.get(name)?.match(/^\s*([a-zA-Z_][\w-]*)(?:\s|$)/)?.[1];
  if (animationName && !keywords.has(animationName) && !keyframes.has(animationName)) {
    failures.push(`${token}: falta @keyframes ${animationName}`);
  }
}

if (failures.length > 0) {
  console.error('El build perdió estilos de animación. Revisa los tokens --animate-* y los @keyframes:\n' + failures.map(failure => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Animaciones verificadas: ${animations.size} clases con sus estilos compilados.`);
}
