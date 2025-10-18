export default function UsloviPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            📜 Uslovi korišćenja
          </h1>
          
          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold mt-6 mb-4">1. Prihvatanje uslova</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Korišćenjem aplikacije Osnovci prihvatate sledeće uslove korišćenja.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">2. Upotreba aplikacije</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Aplikacija je namenjena učenicima osnovnih škola i njihovim roditeljima za praćenje školskih obaveza.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">3. Korisnički nalog</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Korisnici su odgovorni za čuvanje svojih pristupnih podataka i sve aktivnosti na svom nalogu.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">4. Privatnost</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Vaši podaci se čuvaju sigurno i neće biti deljeni sa trećim stranama. 
              Pogledajte našu <a href="/privatnost" className="text-blue-600 hover:underline">politiku privatnosti</a>.
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
              Poslednje ažurirano: Oktobar 2025
            </p>
          </div>

          <a
            href="/prijava"
            className="mt-8 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Nazad na prijavu
          </a>
        </div>
      </div>
    </div>
  );
}

