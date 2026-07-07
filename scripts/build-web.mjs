/**
 * Empaqueta la versión web en un único web/index.html autocontenido:
 * esbuild agrupa src/web/main.ts (con todo el motor) y el resultado se
 * inserta en la plantilla src/web/template.html.
 */
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const resultado = await build({
  entryPoints: ['src/web/main.ts'],
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  charset: 'utf8',
  // Con Phaser dentro, minificar es obligatorio: baja de ~5,8 MB a ~1,5 MB.
  minify: true,
  legalComments: 'none',
  write: false,
});

const js = resultado.outputFiles[0].text;
if (js.includes('</script>')) {
  throw new Error('El bundle contiene "</script>" y rompería el HTML inline.');
}

const plantilla = readFileSync('src/web/template.html', 'utf8');
mkdirSync('web', { recursive: true });
writeFileSync('web/index.html', plantilla.replace('/*__JS__*/', () => js));
console.log(`web/index.html generado (${(js.length / 1024).toFixed(0)} KiB de JS)`);
