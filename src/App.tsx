import React from 'react';
import TextAnalyzer from './components/TextAnalyzer';
import { Brain } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <header className="glass-morphism border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-[var(--neon-primary)]" />
            <h1 className="text-2xl font-bold neon-glow">AI Authorship Verification</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <TextAnalyzer />
      </main>

      <footer className="glass-morphism mt-auto py-6 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} AI Authorship Verification. For demonstration purposes only.</p>
      </footer>
    </div>
  );
}

export default App;