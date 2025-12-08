import { Facebook, Instagram, Mail, Shield } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative px-4 py-12 sm:py-16 sm:px-6 lg:px-8 bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-4 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🎓</span>
              <span className="text-2xl font-bold">Osnovci</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Moderna obrazovna platforma za osnovce i njihove roditelje.
              Sigurna, zabavna i efikasna.
            </p>
            <div className="flex gap-4 mt-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="mailto:info@osnovci.app"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Aplikacija</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/registracija"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Registracija
                </Link>
              </li>
              <li>
                <Link
                  href="/prijava"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Prijava
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Pravno</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privatnost"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Politika privatnosti
                </Link>
              </li>
              <li>
                <Link
                  href="/uslovi"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Uslovi korišćenja
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Kolačići
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © 2025 Osnovci. Sva prava zadržana.
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Shield className="h-4 w-4 text-green-500" />
            <span>COPPA & GDPR usklađeno</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
