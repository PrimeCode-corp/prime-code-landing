// Solo para el build de QA (npm run build:qa): agrega dist/_headers para que
// Cloudflare sirva todo con "X-Robots-Tag: noindex" y Google no indexe QA.
// Producción usa `npm run build`, que no lo genera.
import { writeFileSync } from 'node:fs';

writeFileSync('dist/_headers', '/*\n  X-Robots-Tag: noindex, nofollow\n');
console.log('dist/_headers creado (QA: noindex)');
