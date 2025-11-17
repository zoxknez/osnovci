export default function ZaboravljenaLozinkaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🔐 Zaboravljena lozinka
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Ova funkcionalnost će uskoro biti dostupna.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Za sada možete koristiti demo nalog ili kontaktirati podršku.
          </p>
          <a
            href="/prijava"
            className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Nazad na prijavu
          </a>
        </div>
      </div>
    </div>
  );
}
