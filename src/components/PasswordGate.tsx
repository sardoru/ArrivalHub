import { useState } from 'react';
import { Lock, Building2, ArrowRight } from 'lucide-react';

type PasswordGateProps = {
  onAuthenticated: () => void;
};

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'arrivals2026';

export function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === APP_PASSWORD) {
      localStorage.setItem('arrivalhub_authenticated', 'true');
      onAuthenticated();
    } else {
      setError('Incorrect password');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-lg shadow-blue-500/30 mb-6">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ArrivalHub</h1>
          <p className="text-slate-400">Front Desk Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div 
            className={`bg-slate-800/50 rounded-2xl p-8 border border-slate-700/50 ${
              isShaking ? 'animate-shake' : ''
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-700/50 rounded-xl">
                <Lock className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Enter Password</h2>
                <p className="text-slate-500 text-sm">Access restricted to authorized personnel</p>
              </div>
            </div>

            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-5 py-4 text-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all mb-4"
              placeholder="Enter password"
              autoFocus
            />

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mb-4">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              Access System
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        <p className="text-center text-slate-600 text-sm mt-6">
          Contact your administrator if you need access
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
