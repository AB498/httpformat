const fs = require('fs');
const path = require('path');
const { format } = require('./lib/http-parser');

// List of before files to process
const beforeFiles = [
    '00-comprehensive-showcase-before.http',
    '01-basic-requests-before.http',
    '02-variables-before.http',
    '03-comments-before.http',
    '04-authentication-before.http',
    '05-complex-data-before.http',
    '06-edge-cases-before.http',
    '07-messy-chaos-before.http'
];

const examplesDir = './test-examples';

console.log('Creating before/after examples...\n');

beforeFiles.forEach(beforeFile => {
    const beforePath = path.join(examplesDir, beforeFile);
    const afterFile = beforeFile.replace('-before.', '-after.');
    const afterPath = path.join(examplesDir, afterFile);
    
    console.log(`Processing: ${beforeFile}`);
    
    try {
        // Read the before file
        const beforeContent = fs.readFileSync(beforePath, 'utf8');
        
        // Format the content
        const [formattedContent, error] = format(beforeContent);
        
        if (error) {
            console.error(`  ❌ Error formatting ${beforeFile}:`, error);
            return;
        }
        
        // Write the after file
        fs.writeFileSync(afterPath, formattedContent, 'utf8');
        
        console.log(`  ✅ Created: ${afterFile}`);
        
        // Show a preview of the changes
        const beforeLines = beforeContent.split('\n').length;
        const afterLines = formattedContent.split('\n').length;
        console.log(`  📊 Lines: ${beforeLines} → ${afterLines}`);
        
    } catch (err) {
        console.error(`  ❌ Error processing ${beforeFile}:`, err.message);
    }
    
    console.log('');
});

console.log('✨ All before/after examples created!');
console.log('\nYou can now compare:');
beforeFiles.forEach(beforeFile => {
    const afterFile = beforeFile.replace('-before.', '-after.');
    console.log(`  ${beforeFile} → ${afterFile}`);
});

console.log('\n📁 Files are located in the test-examples/ directory');
