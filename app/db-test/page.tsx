import { createClient } from '@/lib/supabase/server'

export default async function DatabaseTest() {
  const supabase = createClient()
  
  let dbStatus = "Not Connected"
  let tablesStatus: { [key: string]: string } = {}
  let employeeCount = 0
  let configCount = 0
  let error = null

  try {
    // Test each table individually
    const tableTests = [
      { name: 'employees', test: async () => supabase.from('employees').select('*', { count: 'exact', head: true }) },
      { name: 'salary_components', test: async () => supabase.from('salary_components').select('*', { count: 'exact', head: true }) },
      { name: 'app_configuration', test: async () => supabase.from('app_configuration').select('*', { count: 'exact', head: true }) }
    ]

    let successCount = 0
    
    for (const table of tableTests) {
      try {
        const { count, error: tableError } = await table.test()
        if (tableError) {
          tablesStatus[table.name] = `❌ Error: ${tableError.message}`
        } else {
          tablesStatus[table.name] = `✅ Found (${count || 0} rows)`
          successCount++
          
          // Store specific counts
          if (table.name === 'employees') employeeCount = count || 0
          if (table.name === 'app_configuration') configCount = count || 0
        }
      } catch (err: any) {
        tablesStatus[table.name] = `❌ Exception: ${err.message}`
      }
    }

    if (successCount > 0) {
      dbStatus = successCount === tableTests.length ? "Fully Connected" : "Partially Connected"
    } else {
      dbStatus = "Tables Missing"
    }

  } catch (err: any) {
    error = err.message
    dbStatus = "Connection Error"
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium">Connection Status</h3>
          <p className={`text-2xl font-bold ${dbStatus.includes('Connected') ? 'text-green-600' : 'text-red-600'}`}>
            {dbStatus}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium">Tables Status</h3>
          <p className="text-2xl font-bold">{Object.keys(tablesStatus).length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium">Employees</h3>
          <p className="text-2xl font-bold">{employeeCount}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium">Config Items</h3>
          <p className="text-2xl font-bold">{configCount}</p>
        </div>
      </div>

      {/* Table Status Details */}
      <div className="mt-6 bg-white p-6 rounded-lg border">
        <h3 className="font-medium text-lg mb-4">Table Details</h3>
        <div className="space-y-2">
          {Object.entries(tablesStatus).map(([tableName, status]) => (
            <div key={tableName} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="font-medium">{tableName}</span>
              <span className="text-sm">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800">Database Error</h3>
          <p className="text-red-700 text-sm mt-2">{error}</p>
        </div>
      )}

      {dbStatus.includes("Connected") && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800">Database Ready!</h3>
          <p className="text-green-700 text-sm mt-2">
            Your database is properly configured. You can now:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-green-600">
            <li>Create user accounts at <code>/register</code></li>
            <li>Log in at <code>/login</code></li>
            <li>Access the dashboard and modules</li>
          </ul>
        </div>
      )}

      {dbStatus === "Tables Missing" && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800">Tables Not Found</h3>
          <p className="text-yellow-700 text-sm mt-2">
            The database tables haven't been created yet. Please:
          </p>
          <ol className="list-decimal list-inside mt-2 text-sm text-yellow-600">
            <li>Go to your Supabase Dashboard → SQL Editor</li>
            <li>Copy the content from <code>DATABASE_SETUP.sql</code></li>
            <li>Paste and run the SQL query</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      )}
    </div>
  )
}