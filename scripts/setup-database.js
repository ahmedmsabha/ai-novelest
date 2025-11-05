#!/usr/bin/env node

/**
 * Database setup script using Neon serverless driver
 * Runs the SQL migration to create all tables
 */

const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.NEON_DATABASE_URL

if (!DATABASE_URL) {
    console.error('❌ NEON_DATABASE_URL not found in environment variables')
    process.exit(1)
}

const sql = neon(DATABASE_URL)

async function setupDatabase() {
    console.log('🚀 Starting database setup with Neon serverless...\n')

    try {
        console.log('📝 Creating database tables...\n')

        // Create users table
        console.log('⏳ Creating users table...')
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY,
                    email TEXT NOT NULL UNIQUE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            `
            console.log('✅ Users table ready\n')
        } catch (error) {
            console.log(`⚠️  Users table: ${error.message}\n`)
        }

        // Create stories table
        console.log('⏳ Creating stories table...')
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS stories (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    prompt TEXT NOT NULL,
                    genre TEXT NOT NULL,
                    tone TEXT NOT NULL,
                    story_type TEXT NOT NULL DEFAULT 'story',
                    word_count INTEGER NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            `
            console.log('✅ Stories table ready\n')
        } catch (error) {
            console.log(`⚠️  Stories table: ${error.message}\n`)
        }

        // Create user_credits table
        console.log('⏳ Creating user_credits table...')
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS user_credits (
                    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    credits INTEGER NOT NULL DEFAULT 3,
                    total_generated INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `
            console.log('✅ User_credits table ready\n')
        } catch (error) {
            console.log(`⚠️  User_credits table: ${error.message}\n`)
        }

        // Create credits_transactions table
        console.log('⏳ Creating credits_transactions table...')
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS credits_transactions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                    amount INTEGER NOT NULL,
                    transaction_type TEXT NOT NULL,
                    description TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            `
            console.log('✅ Credits_transactions table ready\n')
        } catch (error) {
            console.log(`⚠️  Credits_transactions table: ${error.message}\n`)
        }

        // Create anonymous_usage table
        console.log('⏳ Creating anonymous_usage table...')
        try {
            await sql`
                CREATE TABLE IF NOT EXISTS anonymous_usage (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    session_id TEXT NOT NULL,
                    ip_address TEXT,
                    stories_generated INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `
            console.log('✅ Anonymous_usage table ready\n')
        } catch (error) {
            console.log(`⚠️  Anonymous_usage table: ${error.message}\n`)
        }

        // Create indexes
        console.log('⏳ Creating indexes...')
        try {
            await sql`CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id)`
            await sql`CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC)`
            await sql`CREATE INDEX IF NOT EXISTS idx_stories_story_type ON stories(story_type)`
            await sql`CREATE INDEX IF NOT EXISTS idx_credits_transactions_user_id ON credits_transactions(user_id)`
            await sql`CREATE INDEX IF NOT EXISTS idx_anonymous_usage_session_id ON anonymous_usage(session_id)`
            console.log('✅ Indexes created\n')
        } catch (error) {
            console.log(`⚠️  Indexes: ${error.message}\n`)
        }

        console.log('✨ Database setup completed!\n')
        console.log('📊 Verifying tables...\n')

        // Verify tables exist
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `

        console.log('✅ Tables in database:')
        tables.forEach(table => {
            console.log(`   - ${table.table_name}`)
        })

        console.log('\n🎉 Your database is ready to use!')
        console.log('\nNext steps:')
        console.log('  1. Start the dev server: pnpm dev')
        console.log('  2. Open http://localhost:3000')
        console.log('  3. Create an account and start generating stories!\n')

    } catch (error) {
        console.error('❌ Database setup failed:', error.message)
        console.error('\nFull error:', error)
        console.error('\n💡 Troubleshooting:')
        console.error('   1. Check your NEON_DATABASE_URL is correct')
        console.error('   2. Ensure your Neon database is active')
        console.error('   3. Try running the SQL manually in Neon dashboard')
        console.error('   4. Visit: https://console.neon.tech\n')
        process.exit(1)
    }
}

setupDatabase()
