// Shown when Supabase env vars are missing - guides developer to fix the issue
export default function SetupScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔧</div>
          <h1 className="text-2xl font-bold text-gray-900">Supabase Setup Required</h1>
          <p className="text-gray-600 mt-2 text-sm">
            The app needs your Supabase credentials to run.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm font-semibold">
            ❌ VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set.
          </p>
        </div>

        <div className="space-y-4 text-sm text-gray-700">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-gray-900 mb-2">If deployed on Vercel:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Go to your project on <strong>vercel.com</strong></li>
              <li>Click <strong>Settings → Environment Variables</strong></li>
              <li>Add <code className="bg-gray-200 px-1 rounded">VITE_SUPABASE_URL</code></li>
              <li>Add <code className="bg-gray-200 px-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
              <li>Click <strong>Redeploy</strong> (Deployments tab → ⋯ → Redeploy)</li>
            </ol>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold text-gray-900 mb-2">For local development:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Copy <code className="bg-gray-200 px-1 rounded">.env.example</code> to <code className="bg-gray-200 px-1 rounded">.env</code></li>
              <li>Fill in your values from <strong>Supabase → Settings → API</strong></li>
              <li>Restart the dev server</li>
            </ol>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="font-bold text-blue-800 mb-1">Where to find your keys:</p>
            <p className="text-blue-700">
              Supabase dashboard → Your project → <strong>Settings → API</strong>
              <br />Copy <strong>Project URL</strong> and <strong>anon / public key</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
        >
          Reload after adding keys
        </button>
      </div>
    </div>
  );
}
