// Build script for portable WhatsApp Automation V2
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building portable WhatsApp Automation V2...');

try {
    // Copy portable package.json
    if (fs.existsSync('package-portable.json')) {
        fs.copyFileSync('package-portable.json', 'package.json');
        console.log('✅ Copied portable package.json');
    }
    
    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Build executable
    console.log('🔨 Building executable...');
    execSync('npm run build-exe', { stdio: 'inherit' });
    
    console.log('🎉 Portable build complete!');
    
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
