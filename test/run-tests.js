#!/usr/bin/env node

/**
 * Simple test runner for HTTP Parser tests
 * Can be run independently without npm scripts
 */

const { spawn } = require('child_process');
const path = require('path');

function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            ...options
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        child.on('error', reject);
    });
}

async function main() {
    const args = process.argv.slice(2);
    const testDir = __dirname;
    
    console.log('🧪 Running HTTP Parser Tests...\n');

    try {
        // Check if mocha is available
        try {
            await runCommand('mocha', ['--version'], { stdio: 'pipe' });
        } catch (error) {
            console.log('📦 Installing mocha...');
            await runCommand('npm', ['install', 'mocha', '--save-dev']);
        }

        // Determine which tests to run
        let testPattern = path.join(testDir, '**/*.test.js');
        
        if (args.includes('--unit')) {
            testPattern = path.join(testDir, '{http-parser,lexer}.test.js');
            console.log('🔬 Running unit tests only...\n');
        } else if (args.includes('--integration')) {
            testPattern = path.join(testDir, 'integration.test.js');
            console.log('🔗 Running integration tests only...\n');
        } else {
            console.log('🚀 Running all tests...\n');
        }

        // Build mocha command
        const mochaArgs = [testPattern];
        
        if (args.includes('--watch')) {
            mochaArgs.push('--watch');
            console.log('👀 Running in watch mode...\n');
        }

        if (args.includes('--reporter')) {
            const reporterIndex = args.indexOf('--reporter');
            if (reporterIndex !== -1 && args[reporterIndex + 1]) {
                mochaArgs.push('--reporter', args[reporterIndex + 1]);
            }
        }

        // Run tests
        await runCommand('mocha', mochaArgs);
        
        console.log('\n✅ All tests completed successfully!');

    } catch (error) {
        console.error('\n❌ Tests failed:', error.message);
        process.exit(1);
    }
}

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
HTTP Parser Test Runner

Usage: node run-tests.js [options]

Options:
  --unit          Run only unit tests
  --integration   Run only integration tests
  --watch         Run tests in watch mode
  --reporter <r>  Use specific mocha reporter (spec, json, etc.)
  --help, -h      Show this help message

Examples:
  node run-tests.js                    # Run all tests
  node run-tests.js --unit             # Run only unit tests
  node run-tests.js --watch            # Run tests in watch mode
  node run-tests.js --reporter json    # Use JSON reporter
`);
    process.exit(0);
}

// Run if called directly
if (require.main === module) {
    main();
}
