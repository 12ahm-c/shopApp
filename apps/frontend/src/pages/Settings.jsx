import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../stores/authStore';
import useSettingsStore from '../stores/settingsStore';
import { authApi } from '../api/auth';
import { User, Shield, Phone, KeyRound, Save, Loader2, Store, Globe, MapPin, ReceiptText, Wallet } from 'lucide-react';

export default function Settings() {
  const { t } = useTranslation();
  const { user, login, token } = useAuthStore();
  const { settings: storeSettings, updateSettings: updateStoreSettings } = useSettingsStore();
  const isAdmin = user?.role === 'admin';

  const [nameOverride, setNameOverride] = useState(null);
  const [phoneOverride, setPhoneOverride] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [storeNameOverride, setStoreNameOverride] = useState(null);
  const [storePhoneOverride, setStorePhoneOverride] = useState(null);
  const [storeAddressOverride, setStoreAddressOverride] = useState(null);
  const [currencyOverride, setCurrencyOverride] = useState(null);
  const [languageOverride, setLanguageOverride] = useState(null);
  const [invoiceFooterOverride, setInvoiceFooterOverride] = useState(null);

  const displayName = nameOverride ?? user?.name ?? '';
  const displayPhone = phoneOverride ?? user?.phone ?? '';
  const displayStoreName = storeNameOverride ?? storeSettings?.storeName ?? '';
  const displayStorePhone = storePhoneOverride ?? storeSettings?.storePhone ?? '';
  const displayStoreAddress = storeAddressOverride ?? storeSettings?.storeAddress ?? '';
  const displayCurrency = currencyOverride ?? storeSettings?.currency ?? 'MRU';
  const displayLanguage = languageOverride ?? storeSettings?.language ?? 'fr';
  const displayInvoiceFooter = invoiceFooterOverride ?? storeSettings?.invoiceFooter ?? '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const payload = {
        name: nameOverride ?? user?.name ?? '',
        phone: phoneOverride ?? user?.phone ?? '',
        ...(password ? { password } : {})
      };
      const response = await authApi.updateProfile(payload, user);
      login(response.data, token);
      setNameOverride(null);
      setPhoneOverride(null);

      if (isAdmin) {
        await updateStoreSettings({
          storeName: storeNameOverride ?? storeSettings?.storeName ?? '',
          storePhone: storePhoneOverride ?? storeSettings?.storePhone ?? '',
          storeAddress: storeAddressOverride ?? storeSettings?.storeAddress ?? '',
          currency: currencyOverride ?? storeSettings?.currency ?? 'MRU',
          language: languageOverride ?? storeSettings?.language ?? 'fr',
          invoiceFooter: invoiceFooterOverride ?? storeSettings?.invoiceFooter ?? ''
        });
        setStoreNameOverride(null);
        setStorePhoneOverride(null);
        setStoreAddressOverride(null);
        setCurrencyOverride(null);
        setLanguageOverride(null);
        setInvoiceFooterOverride(null);
      }

      setSuccess(true);
      setError('');
      setPassword('');

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err?.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('settingsPage.title')}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{t('settingsPage.description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-center p-6">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-500">
              <Shield className="w-4 h-4" />
              <span className="uppercase font-medium">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-100 dark:border-emerald-900/30 animate-in fade-in">
                {t('settingsPage.saved')}
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('profile.accountInfo')}</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('profile.fullName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setNameOverride(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('profile.phoneNumber')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                    type="tel"
                    value={displayPhone}
                    onChange={(e) => setPhoneOverride(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('profile.newPassword')}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('profile.passwordPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Store className="w-5 h-5" />
                    <span className="text-sm font-semibold">{t('profile.storeInfo')}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('settingsPage.storeName')}
                      </label>
                      <input
                        type="text"
                        value={displayStoreName}
                        onChange={(e) => setStoreNameOverride(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('settingsPage.phone')}
                      </label>
                      <input
                        type="text"
                        value={displayStorePhone}
                        onChange={(e) => setStorePhoneOverride(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('settingsPage.address')}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                          type="text"
                          value={displayStoreAddress}
                          onChange={(e) => setStoreAddressOverride(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('settingsPage.currency')}
                      </label>
                      <div className="relative">
                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                          value={displayCurrency}
                          onChange={(e) => setCurrencyOverride(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          <option value="MRU">MRU</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('settingsPage.language')}
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <select
                          value={displayLanguage}
                          onChange={(e) => setLanguageOverride(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          <option value="fr">Français</option>
                          <option value="ar">العربية</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('settingsPage.invoiceFooter')}
                      </label>
                      <div className="relative">
                        <ReceiptText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <textarea
                          value={displayInvoiceFooter}
                          onChange={(e) => setInvoiceFooterOverride(e.target.value)}
                          rows={3}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || (!displayName.trim())}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {t('settingsPage.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
