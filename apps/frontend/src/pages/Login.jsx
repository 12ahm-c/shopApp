import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../stores/authStore';
import useSettingsStore from '../stores/settingsStore';
import { authApi } from '../api/auth';
import { Loader2, Eye, EyeOff, Store, ShieldCheck } from 'lucide-react';

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
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />

      <div className="absolute top-[-10%] right-[-5%] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-5%] h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative z-10 flex w-full">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="absolute top-[-20%] right-[-20%] h-[60%] w-[60%] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-20%] h-[60%] w-[60%] rounded-full bg-black/10 blur-3xl" />

          <div className="relative z-10 text-center px-12 max-w-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm mb-8 ring-1 ring-white/20 shadow-xl">
              <Store className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
              {storeName}
            </h1>
            <p className="text-lg text-blue-100/80 leading-relaxed">
              {t('login.subtitle')}
            </p>
            <div className="mt-12 flex items-center justify-center gap-8 text-white/60 text-sm">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {t('login.action')}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/30">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
                {storeName}
              </h1>
              <p className="text-sm text-slate-400">
                {t('login.subtitle')}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 sm:p-10 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  {t('welcome')}
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  {t('login.subtitle')}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-[fadeIn_0.3s_ease]">
                  <div className="flex items-center gap-2">
                    <span className="flex-1">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">
                    {t('phone')}
                  </label>
                  <div className="relative">
                    <span className={`absolute inset-y-0 ${isRtl ? 'right-4' : 'left-4'} flex items-center text-slate-500 text-sm font-medium pointer-events-none border-slate-700/50 ${isRtl ? 'border-l' : 'border-r'} ${isRtl ? 'pl-0 pr-0' : 'pr-4'} ${isRtl ? 'ml-0' : 'mr-0'}`}>
                      +222
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={isRtl ? 'مثال: 33445566' : 'ex: 33445566'}
                      required
                      className={`w-full px-4 py-3.5 ${isRtl ? 'pr-16' : 'pl-16'} rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3.5 rounded-2xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 ${isRtl ? 'left-3' : 'right-3'} flex items-center text-slate-500 hover:text-slate-300 transition-colors`}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    t('login.action')
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-xs text-slate-500">
                  {storeName} &copy; {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
