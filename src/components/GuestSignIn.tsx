import { useState, useRef, useEffect } from 'react';
import { User, Phone, Mail, Shield, CheckCircle, ArrowRight, ArrowLeft, Building2, Globe, PenTool, RotateCcw } from 'lucide-react';
import SignaturePad from 'signature_pad';

type GuestSignInProps = {
  onSignIn: (guestInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    signature: string | null;
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
  
  // Signature pad
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  // Initialize signature pad when on rules step
  useEffect(() => {
    if (step === 'rules' && canvasRef.current && !signaturePadRef.current) {
      const canvas = canvasRef.current;
      
      // Set canvas size for high DPI displays
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);
      
      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgb(30, 41, 59)', // slate-800
        penColor: 'rgb(255, 255, 255)', // white
        minWidth: 1,
        maxWidth: 3,
      });
      
      signaturePadRef.current.addEventListener('endStroke', () => {
        setHasSignature(!signaturePadRef.current?.isEmpty());
      });
    }
    
    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
        signaturePadRef.current = null;
      }
    };
  }, [step]);

  const clearSignature = () => {
    signaturePadRef.current?.clear();
    setHasSignature(false);
  };

  const getSignatureData = (): string | null => {
    if (signaturePadRef.current?.isEmpty()) {
      return null;
    }
    return signaturePadRef.current?.toDataURL('image/png') || null;
  };

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
    
    if (!hasSignature) {
      setError('Please sign below to accept the building rules');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const signature = getSignatureData();
      const result = await onSignIn({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        signature,
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
    setHasSignature(false);
    clearSignature();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-5xl w-full">
          {/* Compact header with back button */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setStep('info')}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 text-base transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Building Rules</h1>
                <p className="text-slate-400 text-sm">Please review and accept</p>
              </div>
            </div>
            <div className="w-16"></div>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
            {/* 3-column grid for rules */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">No Smoking</p>
                    <p className="text-slate-400 text-xs">$200 Penalty</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">No Loud Music After 10pm</p>
                    <p className="text-slate-400 text-xs">Be respectful</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">Absolutely No Parties</p>
                    <p className="text-slate-400 text-xs">Strict enforcement</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">Liability Acceptance</p>
                    <p className="text-slate-400 text-xs">Guest responsibility</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">24/7 Recording</p>
                    <p className="text-slate-400 text-xs">Common areas w/ audio</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-900/30 rounded-lg p-3 border border-red-700/30">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-white text-sm font-medium">Fire Alarm Policy</p>
                    <p className="text-red-300 text-xs">$400 false alarm penalty</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkbox and Signature side by side */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-700/70 transition-all">
                <input
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                  className="w-6 h-6 rounded-lg border-2 border-slate-500 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-white text-base font-medium">
                  I accept all building rules
                </span>
              </label>

              {/* Signature Pad */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 text-sm font-medium flex items-center gap-1.5">
                    <PenTool className="w-4 h-4" />
                    Your Signature
                    {hasSignature && (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>
                </div>
                <div className={`relative rounded-lg overflow-hidden border-2 ${hasSignature ? 'border-emerald-500' : 'border-slate-600'} transition-colors`}>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-20 bg-slate-800 touch-none"
                    style={{ touchAction: 'none' }}
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-slate-500 text-sm">Sign here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleRulesSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-3 rounded-xl text-lg font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing In...
                </>
              ) : (
                <>
                  Complete Sign-In
                  <CheckCircle className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Compact header for iPad landscape */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome!</h1>
            <p className="text-base text-slate-400">Please sign in to check in for your stay</p>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
          {/* 2x2 grid layout for form fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-base font-medium mb-2">
                <User className="w-4 h-4 inline mr-1.5" />
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your first name"
                autoComplete="given-name"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-base font-medium mb-2">
                <User className="w-4 h-4 inline mr-1.5" />
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your last name"
                autoComplete="family-name"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-base font-medium mb-2">
                <Phone className="w-4 h-4 inline mr-1.5" />
                Phone Number
                {isInternationalPhone && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-blue-400">
                    <Globe className="w-3 h-3" />
                    Int'l
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
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="(555) 123-4567"
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-base font-medium mb-2">
                <Mail className="w-4 h-4 inline mr-1.5" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 mt-4">
              <p className="text-red-300 text-base">{error}</p>
            </div>
          )}

          <button
            onClick={handleInfoSubmit}
            className="w-full mt-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl text-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25"
          >
            Continue
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        <div className="flex justify-center mt-4 gap-3">
          <div className={`w-2.5 h-2.5 rounded-full transition-all ${step === 'info' ? 'bg-blue-500 w-6' : 'bg-slate-600'}`}></div>
          <div className={`w-2.5 h-2.5 rounded-full transition-all ${step === 'rules' ? 'bg-blue-500 w-6' : 'bg-slate-600'}`}></div>
        </div>
      </div>
    </div>
  );
}
