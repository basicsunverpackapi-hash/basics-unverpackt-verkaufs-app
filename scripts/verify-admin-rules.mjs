import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const fail = (message) => {
  throw new Error(message);
};

const auth = read('src/pages/Auth.jsx');
const admin = read('src/pages/Bearbeiten.jsx');
const layout = read('src/Layout.jsx');

if (!auth.includes("const ADMIN_PIN = '0613';")) {
  fail('Auth page must define the admin PIN as 0613.');
}

if (!auth.includes('adminCode.trim() === ADMIN_PIN')) {
  fail('Auth page must compare the entered code with ADMIN_PIN.');
}

if (!admin.includes("const ADMIN_PIN = '0613';")) {
  fail('Admin page must define the admin PIN as 0613.');
}

if (!admin.includes('adminCode.trim() !== ADMIN_PIN')) {
  fail('Admin page must reject every code except ADMIN_PIN.');
}

if (!admin.includes('Admin-Code erforderlich')) {
  fail('Admin page must show a code gate before admin tools.');
}

for (const [path, content] of [
  ['src/pages/Bearbeiten.jsx', admin],
  ['src/Layout.jsx', layout],
  ['src/pages/Auth.jsx', auth]
]) {
  if (content.includes("localStorage.getItem('sellerSystemEnabled')")) {
    fail(`${path} must not read sellerSystemEnabled anymore.`);
  }
}

if (admin.includes('toggleSellerSystem') || admin.includes('Verkaeufer-System deaktivieren') || admin.includes('Verkäufer-System deaktivieren')) {
  fail('The seller-system disable toggle must be removed from the admin page.');
}

if (layout.includes('LogOut') || layout.includes('handleLogout')) {
  fail('The logout control must be removed from the layout.');
}

console.log('Admin access checks passed.');
