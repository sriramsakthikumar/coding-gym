import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  X,
  LogIn,
  UserPlus,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { authService, type User } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthChange: (user: User | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthChange,
}) => {
  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (tab === 'signin') {
        const user = await authService.login(username, password);
        setSuccess(`Welcome back, ${user.username}!`);
        setTimeout(() => {
          onAuthChange(user);
          onClose();
        }, 600);
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        const user = await authService.register(username, password);
        setSuccess(`Account created successfully! Logged in as ${user.username}`);
        setTimeout(() => {
          onAuthChange(user);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    onAuthChange(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#181920] border border-[#282a35] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative text-xs">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* If user is already logged in */}
        {currentUser ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-100 flex items-center justify-center mx-auto text-lg font-bold">
              {currentUser.username.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-100">{currentUser.username}</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Signed in • Progress is automatically saved to your profile
              </p>
            </div>

            <div className="p-3 bg-[#131418] border border-[#22242c] rounded-xl text-left space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Account Active & Syncing</span>
              </div>
              <p className="text-zinc-400">
                All your solved problems, draft codes, and skill rating points are stored under this profile.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleLogout}
                className="flex-1 py-2 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-900/50 rounded-xl font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Register Form */
          <div className="space-y-3.5">
            {/* Header */}
            <div>
              <h3 className="font-bold text-sm text-zinc-100">
                {tab === 'signin' ? 'Sign In to CodeGym' : 'Create an Account'}
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Save and sync your problem solving progress online.
              </p>
            </div>

            {/* Switch Tabs */}
            <div className="flex items-center bg-[#131418] p-0.5 rounded-xl border border-[#22242c]">
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tab === 'signin'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tab === 'register'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="p-2.5 bg-rose-950/40 border border-rose-900/50 rounded-xl text-rose-300 flex items-center gap-1.5 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-900/50 rounded-xl text-emerald-300 flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Username */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full bg-[#131418] border border-[#262832] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-[#131418] border border-[#262832] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Confirm Password (Register mode) */}
              {tab === 'register' && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full bg-[#131418] border border-[#262832] rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 mt-1 cursor-pointer"
              >
                {tab === 'signin' ? (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{loading ? 'Creating...' : 'Create Account'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-[#22242c] text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300 text-[11px] transition-colors"
              >
                Continue as Guest (No login)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
