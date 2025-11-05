const { neon } = require("@neondatabase/serverless")
const fs = require("fs")
const path = require("path")

async function runMigration() {
    try {
        // Load environment variables
        const envPath = path.join(__dirname, "..", ".env")
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, "utf-8")
            const lines = envContent.split("\n")
            lines.forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/)
                if (match) {
                    const key = match[1].trim()
                    const value = match[2].trim().replace(/^["']|["']$/g, "")
                    process.env[key] = value
                }
            })
        }

        const databaseUrl = process.env.NEON_DATABASE_URL
        if (!databaseUrl) {
            throw new Error("NEON_DATABASE_URL not found in environment")
        }

        console.log("Connecting to Neon database...")
        const sql = neon(databaseUrl)

        // Read migration file
        const migrationPath = path.join(__dirname, "003_add_publishing_features.sql")
        const migrationSQL = fs.readFileSync(migrationPath, "utf-8")

        console.log("Running migration...")

        // Split by semicolon and run each statement
        const statements = migrationSQL
            .split(";")
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith("--"))

        for (const statement of statements) {
            console.log(`Executing: ${statement.substring(0, 50)}...`)
            await sql(statement)
        }

        console.log("✅ Migration completed successfully!")
    } catch (error) {
        console.error("❌ Migration failed:", error)
        process.exit(1)
    }
}

runMigration()
