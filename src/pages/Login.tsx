import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Wallet, Mail, Lock, Eye, EyeOff, LogIn, UserPlus, User } from 'lucide-react';

export function Login() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
        setSuccessMsg('Conta criada! Verifique seu e-mail para confirmar.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao autenticar';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-[480px] relative z-10 px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Wallet className="text-primary" size={32} />
          </div>
          <h1 className="text-[36px] font-bold text-primary">Saldo Real</h1>
          <p className="text-on-surface-variant mt-2">Controle financeiro inteligente</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.3)]">
          <h2 className="text-[24px] font-semibold text-on-surface mb-1">
            {isSignUp ? 'Criar conta' : 'Bem-vindo de volta'}
          </h2>
          <p className="text-on-surface-variant text-[14px] mb-6">
            {isSignUp ? 'Preencha os dados para começar' : 'Entre com seu e-mail e senha'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            {isSignUp && (
              <div>
                <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1 block">Nome</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome"
                    required={isSignUp}
                    className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1 block">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-12 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error/Success */}
            {error && <p className="text-error text-[14px] bg-error-container/20 border border-error/30 rounded-lg px-4 py-3">{error}</p>}
            {successMsg && <p className="text-primary text-[14px] bg-primary-container/20 border border-primary/30 rounded-lg px-4 py-3">{successMsg}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary text-[14px] font-semibold py-3 rounded-lg hover:bg-primary-fixed transition-all shadow-[0_0_20px_rgba(0,230,118,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-on-primary"></div>
              ) : (
                <>{isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />} {isSignUp ? 'Criar conta' : 'Entrar'}</>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg(''); }}
              className="text-primary text-[14px] hover:underline transition-all"
            >
              {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
