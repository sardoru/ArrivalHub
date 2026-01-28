import { useState } from 'react';
import { User, Phone, Mail, Shield, CheckCircle, ArrowRight, ArrowLeft, Building2, Globe } from 'lucide-react';

type GuestSignInProps = {
  onSignIn: (guestInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  }) => Promise<{ success: boolean; message: string }>;
};

type Step = 'info' | 'rules' | 'success';

// Format phone number as user types
function formatPhoneNumber(value: string): { formatted: string; isInternational: boolean } {
  // Check if it starts with + (international)
  const isInternational = value.startsWith('+');
  
  if (isInternational) {
    // International format: keep + and add spaces for readability
    const digits = value.replace(/[^\d]/g, '');
    
    if (digits.length <= 1) {
      return { formatted: '+' + digits, isInternational: true };
    } else if (digits.length <= 4) {
      // Country code + start of number
      return { formatted: '+' + digits.slice(0, 1) + ' ' + digits.slice(1), isInternational: true };
    } else if (digits.length <= 7) {
      return { formatted: '+' + digits.slice(0, 1) + ' ' + digits.slice(1, 4) + ' ' + digits.slice(4), isInternational: true };
    } else {
      return { 
        formatted: '+' + digits.slice(0, 1) + ' ' + digits.slice(1, 4) + ' ' + digits.slice(4, 7) + ' ' + digits.slice(7, 15), 
        isInternational: true 
      };
    }
  } else {
    // US format: (XXX) XXX-XXXX
    const digits = value.replace(/\D/g, '');
    
    // Remove leading 1 if present (US country code)
    const usDigits = digits.startsWith('1') && digits.length > 10 ? digits.slice(1) : digits;
    
    if (usDigits.length === 0) {
      return { formatted: '', isInternational: false };
    } else if (usDigits.length <= 3) {
      return { formatted: `(${usDigits}`, isInternational: false };
    } else if (usDigits.length <= 6) {
      return { formatted: `(${usDigits.slice(0, 3)}) ${usDigits.slice(3)}`, isInternational: false };
    } else {
      return { formatted: `(${usDigits.slice(0, 3)}) ${usDigits.slice(3, 6)}-${usDigits.slice(6, 10)}`, isInternational: false };
    }
  }
}

export function GuestSignIn({ onSignIn }: GuestSignInProps) {
  const [step, setStep] = useState<Step>('info');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isInternationalPhone, setIsInternationalPhone] = useState(false);
  const [email, setEmail] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInfoSubmit = () => {
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    if (!lastName.trim()) {
      setError('Please enter your last name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setError('');
    setStep('rules');
  };

  const handleRulesSubmit = async () => {
    if (!rulesAccepted) {
      setError('Please accept all building rules to continue');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await onSignIn({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });

      if (result.success) {
        setSuccessMessage(result.message);
        setStep('success');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    setStep('info');
    setFirstName('');
    setLastName('');
    setPhone('');
    setIsInternationalPhone(false);
    setEmail('');
    setRulesAccepted(false);
    setError('');
    setSuccessMessage('');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-emerald-500/20 p-8 rounded-full w-40 h-40 mx-auto mb-8 flex items-center justify-center">
            <CheckCircle className="w-24 h-24 text-emerald-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">You're All Set!</h1>
          <p className="text-2xl text-emerald-200 mb-4">{successMessage}</p>
          <p className="text-xl text-emerald-300 mb-12">
            Please wait while our front desk staff verifies your ID.
          </p>
          <button
            onClick={handleStartOver}
            className="bg-white/10 text-white px-8 py-4 rounded-2xl text-xl font-semibold hover:bg-white/20 transition-all"
          >
            Sign In Another Guest
          </button>
        </div>
      </div>
    );
  }

  if (step === 'rules') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-3xl w-full">
          <button
            onClick={() => setStep('info')}
            className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 text-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700/50">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-amber-500/20 rounded-2xl">
                <Shield className="w-10 h-10 text-amber-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Building Rules</h1>
                <p className="text-slate-400 text-lg">Please review and accept before continuing</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/30">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-xl font-medium">No Smoking</p>
                    <p className="text-slate-400">$200 Penalty for violations</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/30">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-xl font-medium">No Loud Music After 10pm</p>
                    <p className="text-slate-400">Please be respectful of other residents</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/30">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-xl font-medium">Absolutely No Parties</p>
                    <p className="text-slate-400">Strict enforcement policy in effect</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/30">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-xl font-medium">Liability Acceptance</p>
                    <p className="text-slate-400">You accept responsibility for your conduct as a guest</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-5 border border-slate-600/30">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-xl font-medium">24/7 Recording</p>
                    <p className="text-slate-400">All common areas are recorded with audio</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-900/30 rounded-xl p-5 border border-red-700/30">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-xl font-medium">Fire Alarm Policy</p>
                    <p className="text-red-300">
                      In the event of any false or unwarranted fire alarm activation caused directly 
                      or indirectly by the Guest, a non-refundable penalty of <strong>$400.00</strong> will 
                      be assessed for each occurrence.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-4 p-5 bg-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-700/70 transition-all mb-6">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="w-7 h-7 rounded-lg border-2 border-slate-500 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-white text-xl font-medium">
                I have read and accept all building rules
              </span>
            </label>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-300 text-lg">{error}</p>
              </div>
            )}

            <button
              onClick={handleRulesSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-5 rounded-2xl text-2xl font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing In...
                </>
              ) : (
                <>
                  Complete Sign-In
                  <CheckCircle className="w-7 h-7" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-lg shadow-blue-500/30 mb-6">
            <Building2 className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Welcome!</h1>
          <p className="text-xl text-slate-400">Please sign in to check in for your stay</p>
        </div>

        <div className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700/50">
          <div className="space-y-6">
            <div>
              <label className="block text-slate-300 text-lg font-medium mb-3">
                <User className="w-5 h-5 inline mr-2" />
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-5 py-4 text-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your first name"
                autoComplete="given-name"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-lg font-medium mb-3">
                <User className="w-5 h-5 inline mr-2" />
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-5 py-4 text-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your last name"
                autoComplete="family-name"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-lg font-medium mb-3">
                <Phone className="w-5 h-5 inline mr-2" />
                Phone Number
                {isInternationalPhone && (
                  <span className="ml-2 inline-flex items-center gap-1 text-sm text-blue-400">
                    <Globe className="w-4 h-4" />
                    International
                  </span>
                )}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const input = e.target.value;
                  const { formatted, isInternational } = formatPhoneNumber(input);
                  setPhone(formatted);
                  setIsInternationalPhone(isInternational);
                }}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-5 py-4 text-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="(555) 123-4567"
                autoComplete="tel"
              />
              <p className="text-slate-500 text-sm mt-2">
                For international numbers, start with + (e.g., +44 20 7123 4567)
              </p>
            </div>

            <div>
              <label className="block text-slate-300 text-lg font-medium mb-3">
                <Mail className="w-5 h-5 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-5 py-4 text-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mt-6">
              <p className="text-red-300 text-lg">{error}</p>
            </div>
          )}

          <button
            onClick={handleInfoSubmit}
            className="w-full mt-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 rounded-2xl text-2xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25"
          >
            Continue
            <ArrowRight className="w-7 h-7" />
          </button>
        </div>

        <div className="flex justify-center mt-8 gap-3">
          <div className={`w-3 h-3 rounded-full transition-all ${step === 'info' ? 'bg-blue-500 w-8' : 'bg-slate-600'}`}></div>
          <div className={`w-3 h-3 rounded-full transition-all ${step === 'rules' ? 'bg-blue-500 w-8' : 'bg-slate-600'}`}></div>
        </div>
      </div>
    </div>
  );
}
