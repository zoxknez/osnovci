export default function PrivatnostPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            🔒 Politika privatnosti
          </h1>
          
          <div className="prose dark:prose-invert max-w-none">
            <h2 className="text-2xl font-semibold mt-6 mb-4">1. Koje podatke prikupljamo</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Prikupljamo sledeće podatke:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
              <li>Ime i prezime</li>
              <li>Email adresa ili broj telefona</li>
              <li>Školske obaveze i ocene (koje vi unesete)</li>
              <li>Slike domaćih zadataka (opciono)</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-4">2. Kako koristimo vaše podatke</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Vaši podaci se koriste isključivo za:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
              <li>Pružanje funkcionalnosti aplikacije</li>
              <li>Slanje notifikacija o domaćim zadacima</li>
              <li>Poboljšanje korisničkog iskustva</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-4">3. Bezbednost podataka</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Vaši podaci su zaštićeni:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
              <li>Šifrovanjem lozinki (bcrypt)</li>
              <li>HTTPS protokolom</li>
              <li>Sigurnom bazom podataka</li>
              <li>Content filtering-om za decu</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-4">4. Deljenje podataka</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Vaši podaci NIKADA neće biti prodati ili deljeni sa trećim stranama bez vaše saglasnosti.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-4">5. Vaša prava</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Imate pravo da:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 mb-4">
              <li>Pristupite svojim podacima</li>
              <li>Ispravite netačne podatke</li>
              <li>Obrišete svoj nalog i sve podatke</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-4">6. Kontakt</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Za pitanja o privatnosti kontaktirajte: <a href="mailto:privacy@osnovci.rs" className="text-blue-600 hover:underline">privacy@osnovci.rs</a>
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

