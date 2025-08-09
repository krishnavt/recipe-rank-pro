import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('=== REGISTRATION DEBUG START ===')
    
    // Step 1: Parse request body
    let body
    try {
      body = await request.json()
      console.log('✅ Step 1: Body parsed successfully')
    } catch (e) {
      console.error('❌ Step 1: Failed to parse body:', e)
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    
    // Step 2: Check required fields
    const { email, password, name } = body
    if (!email || !password) {
      console.error('❌ Step 2: Missing required fields')
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    console.log('✅ Step 2: Required fields present')
    
    // Step 3: Try to import bcrypt
    let bcrypt
    try {
      bcrypt = require('bcryptjs')
      console.log('✅ Step 3: bcrypt imported successfully')
    } catch (e) {
      console.error('❌ Step 3: Failed to import bcrypt:', e)
      return NextResponse.json({ error: 'bcrypt import failed' }, { status: 500 })
    }
    
    // Step 4: Try to import prisma
    let prisma
    try {
      const { prisma: prismaClient } = require('@/lib/db')
      prisma = prismaClient
      console.log('✅ Step 4: Prisma imported successfully')
    } catch (e) {
      console.error('❌ Step 4: Failed to import prisma:', e)
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    // Step 5: Test database connection
    try {
      const testResult = await prisma.$queryRaw`SELECT 1 as test`
      console.log('✅ Step 5: Database connection successful')
    } catch (e) {
      console.error('❌ Step 5: Database connection failed:', e)
      return NextResponse.json({ error: 'Database query failed', details: e.message }, { status: 500 })
    }
    
    // Step 6: Check if user exists
    try {
      const existingUser = await prisma.$queryRaw`
        SELECT * FROM "User" WHERE email = ${email} LIMIT 1
      `
      
      if (existingUser.length > 0) {
        console.log('❌ Step 6: User already exists')
        return NextResponse.json({ error: 'User already exists' }, { status: 400 })
      }
      console.log('✅ Step 6: User does not exist, can proceed')
    } catch (e) {
      console.error('❌ Step 6: Failed to check existing user:', e)
      return NextResponse.json({ error: 'Failed to check existing user', details: e.message }, { status: 500 })
    }
    
    // Step 7: Hash password
    let hashedPassword
    try {
      hashedPassword = await bcrypt.hash(password, 12)
      console.log('✅ Step 7: Password hashed successfully')
    } catch (e) {
      console.error('❌ Step 7: Failed to hash password:', e)
      return NextResponse.json({ error: 'Failed to hash password', details: e.message }, { status: 500 })
    }
    
    // Step 8: Create user
    try {
      const result = await prisma.$queryRaw`
        INSERT INTO "User" (id, email, name, "hashedPassword", "subscriptionTier", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${email}, ${name || null}, ${hashedPassword}, 'starter', NOW(), NOW())
        RETURNING id, email, name
      `
      
      const user = result[0]
      console.log('✅ Step 8: User created successfully:', user.id)
      console.log('=== REGISTRATION DEBUG END ===')
      
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      })
    } catch (e) {
      console.error('❌ Step 8: Failed to create user:', e)
      return NextResponse.json({ error: 'Failed to create user', details: e.message }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:', error)
    return NextResponse.json({
      error: 'Unexpected server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
