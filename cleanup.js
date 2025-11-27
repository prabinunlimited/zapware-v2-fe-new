import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Removing ALL console logs from src directory...');

function removeConsoleLogs(dir) {
  const files = fs.readdirSync(dir);
  let cleanedCount = 0;
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      cleanedCount += removeConsoleLogs(fullPath);
    } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        const original = content;
        
        // Remove ALL console.log, console.debug, console.trace statements
        content = content.replace(/console\.(log|debug|trace|info|warn|error)\([^)]*\);?/g, '');
        content = content.replace(/console\.(group|groupEnd|time|timeEnd)\([^)]*\);?/g, '');
        
        if (content !== original) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`✅ Cleaned: ${fullPath}`);
          cleanedCount++;
        }
      } catch (error) {
        console.log(`❌ Error: ${fullPath}`);
      }
    }
  });
  
  return cleanedCount;
}

const total = removeConsoleLogs('src');
console.log(`\n🎉 Removed console logs from ${total} files!`);
console.log('🔄 Please restart your development server.');