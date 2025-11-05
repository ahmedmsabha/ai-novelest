import { neon, neonConfig } from "@neondatabase/serverless"
import ws from "ws"

// Configure WebSocket for Node.js environment
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws
}

// Note: fetchConnectionCache is now always enabled by default (deprecated option)
neonConfig.poolQueryViaFetch = true

// Create a singleton connection
let sqlInstance: ReturnType<typeof neon> | null = null

export function getDbConnection() {
  if (!sqlInstance) {
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error("NEON_DATABASE_URL is not defined")
    }

    sqlInstance = neon(process.env.NEON_DATABASE_URL, {
      fetchOptions: {
        cache: "no-store",
      },
    })
  }

  return sqlInstance
}

// For backward compatibility
export const sql = getDbConnection()
