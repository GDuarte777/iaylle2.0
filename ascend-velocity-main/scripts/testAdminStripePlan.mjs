import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

function parseEnv(content) {
  const result = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    result[key] = value
  }
  return result
}

const env = parseEnv(await readFile(new URL('../.env', import.meta.url), 'utf8'))
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('missing_env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const { data, error } = await supabase.functions.invoke('admin-stripe-plan', {
  body: {
    action: 'create',
    plan: {
      name: 'Teste',
      price: 45,
      interval: 'monthly',
      description: 'Teste',
      features: [],
      color: 'from-blue-500 to-cyan-500',
      isPopular: false,
    },
  },
})

if (error) {
  console.error('invoke_error', {
    message: error.message,
    status: error.status,
    name: error.name,
  })
  process.exit(1)
}

console.log('invoke_ok', {
  hasPlan: Boolean(data?.plan),
  planId: data?.plan?.id,
  gatewayProductId: data?.plan?.gateway_product_id,
})

