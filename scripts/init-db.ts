import { initializeDatabase } from "../lib/db-schema"

async function main() {
  try {
    console.log("Initializing database...")
    await initializeDatabase()
    console.log("Database initialization completed")
    process.exit(0)
  } catch (error) {
    console.error("Database initialization failed:", error)
    process.exit(1)
  }
}

main()
