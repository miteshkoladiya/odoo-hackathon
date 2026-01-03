import { MongoClient, type Db } from "mongodb"

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017"

  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not set")
  }

  const client = new MongoClient(mongoUri)

  try {
    await client.connect()
    const db = client.db(process.env.MONGODB_DB_NAME || "hrms")

    cachedClient = client
    cachedDb = db

    return { client, db }
  } catch (error) {
    console.error("MongoDB connection failed:", error)
    throw error
  }
}

export async function closeDatabase() {
  if (cachedClient) {
    await cachedClient.close()
    cachedClient = null
    cachedDb = null
  }
}
