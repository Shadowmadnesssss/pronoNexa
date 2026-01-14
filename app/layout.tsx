import type { Metadata } from 'next';
import './globals.css';
import logo from '../assets/logo.png' 
import Image from 'next/image';
export const metadata: Metadata = {
  title: 'PronoNexa - Pronostics de Football',
  description: 'Application de pronostics de football pour les matchs de l\'école',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gradient-to-br from-purple-500 to-purple-800">
        <nav className="bg-purple-100 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Image src={logo} alt="Logo" className="h-12 w-auto" width={250} height={250} /> 
                <h1 className="text-2xl font-bold text-purple-600"> PronoNexa</h1>
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="/"
                  className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Accueil
                </a>
                <a
                  href="/matches"
                  className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Matchs
                </a>
                <a
                  href="/leaderboard"
                  className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Classement
                </a>
                <a
                  href="/admin"
                  className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Admin
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
