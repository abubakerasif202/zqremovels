import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.join(__dirname, '..'));

Object.defineProperty(process.versions, 'node', { value: '22.12.0', configurable: true });
