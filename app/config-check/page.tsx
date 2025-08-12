export default function ConfigCheck() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Configuration Check</h1>
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">Supabase URL:</h3>
          <p className="text-sm text-muted-foreground">
            {supabaseUrl ? `✅ Set: ${supabaseUrl.substring(0, 50)}...` : '❌ Not set'}
          </p>
        </div>
        <div>
          <h3 className="font-medium">Supabase Anon Key:</h3>
          <p className="text-sm text-muted-foreground">
            {supabaseAnonKey ? `✅ Set: ${supabaseAnonKey.substring(0, 50)}...` : '❌ Not set'}
          </p>
        </div>
        {!supabaseUrl || !supabaseAnonKey ? (
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-800">Configuration Missing</h4>
            <p className="text-red-700 text-sm mt-2">
              Please create a `.env.local` file in your project root with your Supabase credentials.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800">Configuration OK</h4>
            <p className="text-green-700 text-sm mt-2">
              Your Supabase configuration is set up correctly.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}