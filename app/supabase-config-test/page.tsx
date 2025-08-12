import { createClient } from '@/lib/supabase/server'

export default async function SupabaseConfigTest() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  let connectionTest = "Not tested"
  let clientInfo = "Not available"
  let error = null

  try {
    const supabase = createClient()
    
    // Get client info (this should work without any database queries)
    clientInfo = `Client created successfully`
    
    // Try a very basic operation that doesn't require auth
    const { data, error: testError } = await supabase
      .from('app_configuration')
      .select('count')
      .limit(0) // This should not return data but test the connection
    
    if (testError) {
      connectionTest = `❌ Connection failed: ${testError.message}`
    } else {
      connectionTest = `✅ Basic connection works`
    }
    
  } catch (err: any) {
    error = err.message
    connectionTest = `❌ Exception: ${err.message}`
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Supabase Configuration Test</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-medium text-lg mb-4">Environment Variables</h3>
          <div className="space-y-2">
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>
              <p className="text-sm text-gray-600 break-all">
                {url ? `✅ ${url}` : '❌ Not set'}
              </p>
            </div>
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>
              <p className="text-sm text-gray-600 break-all">
                {anonKey ? `✅ ${anonKey.substring(0, 50)}...` : '❌ Not set'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-medium text-lg mb-4">Client Test</h3>
          <div className="space-y-2">
            <div>
              <strong>Client Creation:</strong>
              <p className="text-sm text-gray-600">{clientInfo}</p>
            </div>
            <div>
              <strong>Connection Test:</strong>
              <p className="text-sm text-gray-600">{connectionTest}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800">Error Details</h3>
            <p className="text-red-700 text-sm mt-2">{error}</p>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800">Next Steps</h3>
          <p className="text-yellow-700 text-sm mt-2">
            If the configuration looks correct but you're still getting "database error querying schema":
          </p>
          <ol className="list-decimal list-inside mt-2 text-sm text-yellow-600">
            <li>Go to <code>/minimal-auth</code> to test authentication step by step</li>
            <li>Check your Supabase project settings in the dashboard</li>
            <li>Verify the database tables exist in your Supabase project</li>
            <li>Check if there are any RLS policies blocking access</li>
          </ol>
        </div>
      </div>
    </div>
  )
}