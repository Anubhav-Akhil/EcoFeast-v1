const fs = require('fs');
let content = fs.readFileSync('pages/Dashboards.tsx', 'utf8');
const regex = /<p className="text-\[11px\] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">.*\{storeName\}<\/p>/;
content = content.replace(regex, '<p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">📍 {storeName}</p>');
fs.writeFileSync('pages/Dashboards.tsx', content, 'utf8');
console.log('Fixed Dashboards.tsx emoji');
