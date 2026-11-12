// Copies app/ to dist/ and stamps the build: the git sha of HEAD goes into <meta name="build">
// and the footer (R6). The session goes into dist/config.js only, so it never sits in git.
import { execSync } from 'node:child_process';
import { cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';

const sha = process.env.BUILD_SHA || execSync('git rev-parse HEAD').toString().trim();
const dirty = execSync('git status --porcelain -- app').toString().trim();
if (dirty && !process.env.ALLOW_DIRTY) throw new Error(`app/ has uncommitted changes; commit first so the sha is true:\n${dirty}`);
const session = process.env.SESSION || readFileSync(new URL('../../.session', import.meta.url), 'utf8').trim();
const api = process.env.API || 'https://hq.mega.dev/challenges/show-me-when/api';

rmSync('dist', { recursive: true, force: true });
cpSync('app', 'dist', { recursive: true });
writeFileSync('dist/index.html', readFileSync('dist/index.html', 'utf8').replaceAll('__BUILD_SHA__', sha));
writeFileSync('dist/config.js', `export const API = ${JSON.stringify(api)};\nexport const SESSION = ${JSON.stringify(session)};\n`);
console.log(`dist/ built at ${sha}`);
