// test-hash.js
import crypto from 'crypto';

const secret = '0219da9c6548d4ed99765300ab5d29c368466500df240f74ed09612166c2acce'; // Tu clave secreta
const manifest = 'id:34461427382;request-id:444adb71-2654-4ce6-aa7d-41440918639c;ts:1759495303;'; // Manifest de tu log

const hash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
console.log('Hash calculado:', hash);