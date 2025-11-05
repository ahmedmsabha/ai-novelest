#!/usr/bin/env node

/**
 * Setup verification script
 * Checks if all required dependencies and environment variables are configured
 */

const fs = require('fs')
const path = require('path')

const errors = []
const warnings = []

console.log('🔍 Verifying project setup...\n')

// Check if .env file exists
if (!fs.existsSync('.env')) {
    errors.push('.env file not found. Copy .env.example to .env and fill in your credentials.')
} else {
    console.log('✅ .env file exists')

    // Check environment variables
    const envContent = fs.readFileSync('.env', 'utf-8')

    const requiredVars = [
        'GOOGLE_GENERATIVE_AI_API_KEY',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEON_DATABASE_URL'
    ]

    requiredVars.forEach(varName => {
        const regex = new RegExp(`${varName}=(.+)`)
        const match = envContent.match(regex)

        if (!match) {
            errors.push(`Missing ${varName} in .env file`)
        } else if (match[1].includes('your_') || match[1].includes('_here')) {
            warnings.push(`${varName} appears to be a placeholder value`)
        } else {
            console.log(`✅ ${varName} is set`)
        }
    })
}

// Check if node_modules exists
if (!fs.existsSync('node_modules')) {
    warnings.push('node_modules not found. Run "pnpm install" to install dependencies.')
} else {
    console.log('✅ Dependencies installed')
}

// Check package.json
if (fs.existsSync('package.json')) {
    console.log('✅ package.json exists')

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))

    // Check required dependencies
    const requiredDeps = [
        '@ai-sdk/google',
        '@neondatabase/serverless',
        '@supabase/supabase-js',
        'ai',
        'next',
        'react'
    ]

    requiredDeps.forEach(dep => {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
            console.log(`✅ ${dep} is in dependencies`)
        } else {
            errors.push(`Missing required dependency: ${dep}`)
        }
    })
} else {
    errors.push('package.json not found')
}

// Check TypeScript config
if (fs.existsSync('tsconfig.json')) {
    console.log('✅ tsconfig.json exists')
} else {
    errors.push('tsconfig.json not found')
}

// Check Next.js config
if (fs.existsSync('next.config.mjs') || fs.existsSync('next.config.js')) {
    console.log('✅ Next.js config exists')
} else {
    errors.push('next.config.mjs not found')
}

// Check required directories
const requiredDirs = ['app', 'components', 'lib', 'public']
requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`✅ ${dir}/ directory exists`)
    } else {
        errors.push(`Missing required directory: ${dir}/`)
    }
})

// Print summary
console.log('\n' + '='.repeat(50))

if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:')
    errors.forEach(error => console.log(`  - ${error}`))
}

if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    warnings.forEach(warning => console.log(`  - ${warning}`))
}

if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✨ All checks passed! Your project is ready.')
    console.log('\nNext steps:')
    console.log('  1. Run database migrations (see DEVELOPMENT.md)')
    console.log('  2. Start dev server: pnpm dev')
    console.log('  3. Open http://localhost:3000')
} else if (errors.length === 0) {
    console.log('\n⚠️  Setup incomplete but no critical errors.')
    console.log('Please review the warnings above.')
} else {
    console.log('\n❌ Setup verification failed.')
    console.log('Please fix the errors above before continuing.')
    process.exit(1)
}

console.log()
