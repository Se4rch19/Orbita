import { readFile, writeFile } from 'node:fs/promises';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
const dependencies=Object.entries(lock.packages).filter(([path])=>path).map(([path,p])=>({package:path.replace(/^.*node_modules\//,''),version:p.version,license:p.license||'Ver LICENSE del paquete',developmentOnly:!!p.dev}));
await writeFile('docs/DEPENDENCIAS.json',JSON.stringify({generated:'2026-09-08',source:'package-lock.json',dependencies},null,2));
