import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import crypto from 'crypto'

// Simple encryption/decryption using AES-256-CBC
const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || 'default-key-change-in-production-32char'
const ALGORITHM = 'aes-256-cbc'

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':')
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format')
  }
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// GET - Retrieve user settings
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user settings from database
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching user settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        openai_api_key: '',
        anthropic_api_key: '',
        default_model: 'gpt-4o',
        auto_save: true
      })
    }

    // Decrypt API keys if they exist
    let openaiKey = ''
    let anthropicKey = ''
    
    try {
      if (settings.openai_api_key_encrypted) {
        openaiKey = decrypt(settings.openai_api_key_encrypted)
      }
      if (settings.anthropic_api_key_encrypted) {
        anthropicKey = decrypt(settings.anthropic_api_key_encrypted)
      }
    } catch (decryptError) {
      console.error('Error decrypting API keys:', decryptError)
      // Return settings without API keys if decryption fails
    }

    return NextResponse.json({
      openai_api_key: openaiKey,
      anthropic_api_key: anthropicKey,
      default_model: settings.default_model,
      auto_save: settings.auto_save
    })

  } catch (error) {
    console.error('Error in GET user-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update user settings
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { default_model, auto_save, openai_api_key, anthropic_api_key } = body

    // Encrypt API keys
    let openaiEncrypted = null
    let anthropicEncrypted = null

    try {
      if (openai_api_key && openai_api_key.trim()) {
        openaiEncrypted = encrypt(openai_api_key.trim())
      }
      if (anthropic_api_key && anthropic_api_key.trim()) {
        anthropicEncrypted = encrypt(anthropic_api_key.trim())
      }
    } catch (encryptError) {
      console.error('Error encrypting API keys:', encryptError)
      return NextResponse.json({ error: 'Failed to encrypt API keys' }, { status: 500 })
    }

    // Prepare update data
    const updateData = {
      user_id: user.id,
      ...(default_model && { default_model }),
      ...(typeof auto_save === 'boolean' && { auto_save }),
      ...(openaiEncrypted !== null && { openai_api_key_encrypted: openaiEncrypted }),
      ...(anthropicEncrypted !== null && { anthropic_api_key_encrypted: anthropicEncrypted })
    }

    // Use upsert to handle both insert and update
    const { error } = await supabase
      .from('user_settings')
      .upsert(updateData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Error saving user settings:', error)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Settings saved successfully' 
    })

  } catch (error) {
    console.error('Error in POST user-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 