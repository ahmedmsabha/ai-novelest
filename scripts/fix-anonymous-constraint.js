#!/usr/bin/env node
import "dotenv/config"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL)

async function fixAnonymousUsageTable() {
    console.log("Adding unique constraint to anonymous_usage table...")

    try {
        // Add unique constraint
        await sql`
      ALTER TABLE anonymous_usage 
      ADD CONSTRAINT unique_session_id UNIQUE (session_id)
    `

        console.log("✅ Unique constraint added successfully!")

        // Verify the constraint
        const result = await sql`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'anonymous_usage'
    `

        console.log("\nConstraints on anonymous_usage table:")
        console.table(result)
    } catch (error) {
        if (error.message.includes("already exists")) {
            console.log("✅ Unique constraint already exists!")
        } else {
            console.error("❌ Error:", error.message)
            throw error
        }
    }
}

fixAnonymousUsageTable()
