import { prisma } from '../db'

export interface CreateUserData {
  email: string
  name?: string | null
  hashedPassword: string
}

export interface User {
  id: string
  email: string
  name: string | null
  hashedPassword: string | null
  subscriptionTier: string
  createdAt: Date
  updatedAt: Date
}

export class UserService {
  static async createUser(data: CreateUserData): Promise<User> {
    try {
      // Use raw SQL to avoid prepared statement issues
      const result = await prisma.$queryRaw<User[]>`
        INSERT INTO "User" (id, email, name, "hashedPassword", "subscriptionTier", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${data.email}, ${data.name || null}, ${data.hashedPassword}, 'starter', NOW(), NOW())
        RETURNING *
      `
      
      return result[0]
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await prisma.$queryRaw<User[]>`
        SELECT * FROM "User" WHERE email = ${email} LIMIT 1
      `
      
      return result[0] || null
    } catch (error) {
      console.error('Error finding user by email:', error)
      throw error
    }
  }

  static async findUserById(id: string): Promise<User | null> {
    try {
      const result = await prisma.$queryRaw<User[]>`
        SELECT * FROM "User" WHERE id = ${id} LIMIT 1
      `
      
      return result[0] || null
    } catch (error) {
      console.error('Error finding user by id:', error)
      throw error
    }
  }

  static async countUsers(): Promise<number> {
    try {
      const result = await prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*) as count FROM "User"
      `
      return Number(result[0].count)
    } catch (error) {
      console.error('Error counting users:', error)
      throw error
    }
  }
}
