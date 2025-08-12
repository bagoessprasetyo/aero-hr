import { createClient } from '@/lib/supabase/server'

export default async function SimpleTest() {
  const supabase = createClient()
  
  let status = "Testing..."
  let details = ""

  try {
    // Simple test - just check if we can connect
    const { data, error } = await supabase
      .from('app_configuration')
      .select('count')
      .limit(1)
    
    if (error) {
      status = "❌ Database Error"
      details = error.message
    } else {
      status = "✅ Database Connected"
      details = "Tables exist and accessible"
    }
  } catch (err: any) {
    status = "❌ Connection Error" 
    details = err.message
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Simple Database Test</h1>
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-2">{status}</h2>
        <p className="text-gray-600">{details}</p>
        
        {status.includes("❌") && (
          <div className="mt-4 p-4 bg-red-50 rounded">
            <h3 className="font-medium text-red-800">Next Steps:</h3>
            <ol className="list-decimal list-inside mt-2 text-red-700">
              <li>Go to your Supabase Dashboard</li>
              <li>Click "SQL Editor" → "New Query"</li>
              <li>Copy content from DATABASE_SETUP.sql</li>
              <li>Paste and click "Run"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}