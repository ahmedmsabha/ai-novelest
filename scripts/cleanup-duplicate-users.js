#!/usr/bin/env node

/**
 * Clean up duplicate user by email
 */

const { neon } = require('@neondatabase/serverless')

const DATABASE_URL = process.env.NEON_DATABASE_URL

if (!DATABASE_URL) {
    console.error('❌ NEON_DATABASE_URL not found in environment variables')
    process.exit(1)
}

const sql = neon(DATABASE_URL)

async function cleanupDuplicateUsers() {
    console.log('🧹 Cleaning up duplicate users...\n')

    try {
        const email = 'eng.ahmed.sabha@gmail.com'
        const oldUserId = 'ec93e4f8-4d73-495d-bd54-e5c8024f4e99'

        console.log(`Looking for user with email: ${email}`)
        console.log(`Old user ID: ${oldUserId}\n`)

        // Check if there are any credits for the old user
        const oldCredits = await sql`
            SELECT * FROM user_credits WHERE user_id = ${oldUserId}
        `

        if (oldCredits.length > 0) {
            console.log(`Found ${oldCredits[0].credits} credits for old user`)
            console.log('Deleting old user credits...')
            await sql`DELETE FROM user_credits WHERE user_id = ${oldUserId}`
            console.log('✅ Deleted old credits\n')
        }

        // Check for stories
        const oldStories = await sql`
            SELECT COUNT(*) as count FROM stories WHERE user_id = ${oldUserId}
        `

        if (oldStories[0].count > 0) {
            console.log(`⚠️  Found ${oldStories[0].count} stories for old user`)
            console.log('Keeping stories but removing user reference...')
            await sql`UPDATE stories SET user_id = NULL WHERE user_id = ${oldUserId}`
            console.log('✅ Updated stories\n')
        }

        // Delete the old user
        console.log('Deleting old user record...')
        await sql`DELETE FROM users WHERE id = ${oldUserId}`
        console.log('✅ Deleted old user\n')

        console.log('🎉 Cleanup complete! Try logging in again.\n')

    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    }
}

cleanupDuplicateUsers()
