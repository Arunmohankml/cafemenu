const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local not found");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let rawKey = "";
for (const line of lines) {
  if (line.trim().startsWith('FIREBASE_PRIVATE_KEY=')) {
    rawKey = line.substring(line.indexOf('=') + 1).trim();
    break;
  }
}

console.log("--- RAW KEY LINE FROM FILE ---");
console.log(rawKey);

// Parse the raw key just like nextjs does (it might have outer quotes)
let key = rawKey;
if (key.startsWith('"') && key.endsWith('"')) {
  key = key.slice(1, -1);
} else if (key.startsWith("'") && key.endsWith("'")) {
  key = key.slice(1, -1);
}

console.log("--- STRIPPED KEY ---");
console.log("Starts with:", JSON.stringify(key.substring(0, 50)));
console.log("Ends with:", JSON.stringify(key.substring(key.length - 50)));

// Clean up newlines:
// Next.js double quoted env values parse \n into actual newlines automatically
// But if they are double-quoted and read, let's see:
const keyWithActualNewlines = key.replace(/\\n/g, '\n');
console.log("--- KEY WITH ACTUAL NEWLINES ---");
console.log("Starts with:", JSON.stringify(keyWithActualNewlines.substring(0, 50)));
console.log("Ends with:", JSON.stringify(keyWithActualNewlines.substring(keyWithActualNewlines.length - 50)));
console.log("Has actual newlines:", keyWithActualNewlines.includes('\n'));

const crypto = require('crypto');
try {
  crypto.createPrivateKey(keyWithActualNewlines);
  console.log("✅ Success: Key parsed perfectly by Node.js crypto!");
} catch (e) {
  console.error("❌ Fail: Node.js crypto failed to parse key!");
  console.error(e.message);
}
