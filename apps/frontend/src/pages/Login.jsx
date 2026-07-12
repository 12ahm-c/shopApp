import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../stores/authStore';
import useSettingsStore from '../stores/settingsStore';
import { authApi } from '../api/auth';
import { Loader2, Eye, EyeOff, Store, Globe } from 'lucide-react';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const storeName = settings?.storeName || t('store_name');
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'ar' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login(phone, password);
      login(res.data.user, res.data.accessToken);

      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/pos');
      }
    } catch (err) {
      setError(err.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#060a14]">
      {/* Background orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full bg-cyan-600/6 blur-[100px]" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full bg-indigo-600/5 blur-[80px]" />
      </div>

      {/* Language toggle */}
      <button
        type="button"
        onClick={toggleLanguage}
        className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-sm backdrop-blur-sm`}
      >
        <Globe className="w-4 h-4" />
        {isRtl ? 'FR' : 'ع'}
      </button>

      <div className="relative z-10 w-full max-w-[420px] mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 mb-5 shadow-xl shadow-blue-500/25">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {storeName}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/[0.06] p-8 shadow-2xl shadow-black/40">
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {t('phone')}
              </label>
              <div className="relative">
                <span className={`absolute inset-y-0 ${isRtl ? 'right-0 pl-3' : 'left-0 pr-3'} flex items-center text-slate-500 text-sm font-medium pointer-events-none`}>
                  <span className={`px-3 ${isRtl ? 'border-l' : 'border-r'} border-white/10`}>+222</span>
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={isRtl ? '33 44 55 66' : '33 44 55 66'}
                  required
                  className={`w-full py-3.5 ${isRtl ? 'pr-20 pl-4' : 'pl-20 pr-4'} rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all text-sm`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full py-3.5 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 ${isRtl ? 'left-0' : 'right-0'} flex items-center px-4 text-slate-500 hover:text-slate-300 transition-colors`}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t('login.action')
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          {storeName} &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
