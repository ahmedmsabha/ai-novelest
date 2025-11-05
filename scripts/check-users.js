#!/usr/bin/env node

/**
 * Check and fix users table
 */

const { neon } = require('@neondatabase/serverless')

const DATABASE_URL = process.env.NEON_DATABASE_URL

if (!DATABASE_URL) {
    console.error('❌ NEON_DATABASE_URL not found in environment variables')
    process.exit(1)
}

const sql = neon(DATABASE_URL)

async function checkAndFixUsers() {
    console.log('🔍 Checking users table...\n')

    try {
        // Get all users
        const users = await sql`SELECT id, email, created_at FROM users ORDER BY created_at DESC`

        console.log('📊 Current users in database:')
        users.forEach(u => {
            console.log(`   ${u.id} | ${u.email}`)
        })
        console.log(`\nTotal users: ${users.length}\n`)

        // Check for duplicate emails
        const emails = users.map(u => u.email)
        const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index)

        if (duplicates.length > 0) {
            console.log('⚠️  Found duplicate emails:')
            duplicates.forEach(email => console.log(`   - ${email}`))
            console.log('\n💡 You may want to clean up duplicate users manually in Neon dashboard\n')
        } else {
            console.log('✅ No duplicate emails found\n')
        }

        // Check for orphaned credits
        const credits = await sql`
            SELECT uc.user_id, uc.credits 
            FROM user_credits uc
            LEFT JOIN users u ON uc.user_id = u.id
            WHERE u.id IS NULL
        `

        if (credits.length > 0) {
            console.log('⚠️  Found orphaned credits (user_credits without matching users):')
            credits.forEach(c => console.log(`   User ID: ${c.user_id} | Credits: ${c.credits}`))
            console.log('\n🔧 Cleaning up orphaned credits...')

            for (const credit of credits) {
                await sql`DELETE FROM user_credits WHERE user_id = ${credit.user_id}`
                console.log(`   ✅ Removed credits for user ${credit.user_id}`)
            }
            console.log()
        } else {
            console.log('✅ No orphaned credits found\n')
        }

        console.log('🎉 Database check complete!\n')

    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    }
}

checkAndFixUsers()
