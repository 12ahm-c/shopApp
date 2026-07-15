import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../stores/authStore';
import useSettingsStore from '../stores/settingsStore';
import { authApi } from '../api/auth';
import { User, Shield, Phone, KeyRound, Save, Loader2, Store, Globe, MapPin, ReceiptText, Wallet, Camera, X, Image } from 'lucide-react';

export default function Settings() {
  const { t } = useTranslation();
  const { user, login, token } = useAuthStore();
  const { settings: storeSettings, updateSettings: updateStoreSettings } = useSettingsStore();
  const isAdmin = user?.role === 'admin';
  const logoInputRef = useRef(null);

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
  const [storeLogoOverride, setStoreLogoOverride] = useState(null);

  const displayName = nameOverride ?? user?.name ?? '';
  const displayPhone = phoneOverride ?? user?.phone ?? '';
  const displayStoreName = storeNameOverride ?? storeSettings?.storeName ?? '';
  const displayStorePhone = storePhoneOverride ?? storeSettings?.storePhone ?? '';
  const displayStoreAddress = storeAddressOverride ?? storeSettings?.storeAddress ?? '';
  const displayCurrency = currencyOverride ?? storeSettings?.currency ?? 'MRU';
  const displayLanguage = languageOverride ?? storeSettings?.language ?? 'fr';
  const displayInvoiceFooter = invoiceFooterOverride ?? storeSettings?.invoiceFooter ?? '';
  const displayStoreLogo = storeLogoOverride ?? storeSettings?.storeLogo ?? null;

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const compress = (maxSize, quality) => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          if (width > height) {
            if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
          } else {
            if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          return canvas.toDataURL('image/jpeg', quality);
        };
        let dataUrl = compress(400, 0.9);
        if (dataUrl.length > 1.5 * 1024 * 1024) {
          dataUrl = compress(250, 0.7);
        }
        if (dataUrl.length > 1.5 * 1024 * 1024) {
          dataUrl = compress(150, 0.5);
        }
        if (dataUrl.length > 1.5 * 1024 * 1024) {
          dataUrl = compress(100, 0.3);
        }
        setStoreLogoOverride(dataUrl);
      };
      img.onerror = () => {
        setError(t('settingsPage.logoMaxSize'));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setStoreLogoOverride('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

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
          invoiceFooter: invoiceFooterOverride ?? storeSettings?.invoiceFooter ?? '',
          storeLogo: storeLogoOverride !== null ? storeLogoOverride : storeSettings?.storeLogo ?? ''
        });
        setStoreNameOverride(null);
        setStorePhoneOverride(null);
        setStoreAddressOverride(null);
        setCurrencyOverride(null);
        setLanguageOverride(null);
        setInvoiceFooterOverride(null);
        setStoreLogoOverride(null);
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
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          {t('settingsPage.title')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{t('settingsPage.description')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-surface-border rounded-2xl overflow-hidden text-center p-6">
            <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">{user?.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span className="uppercase font-medium">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-2">
          <div className="bg-card border border-surface-border rounded-2xl p-6">
            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-500/20 animate-in fade-in">
                {t('settingsPage.saved')}
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="text-lg font-semibold text-text-primary">{t('profile.accountInfo')}</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  {t('profile.fullName')}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setNameOverride(e.target.value)}
                    required
                    className="!pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  {t('profile.phoneNumber')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                    type="tel"
                    value={displayPhone}
                    onChange={(e) => setPhoneOverride(e.target.value)}
                    required
                    className="!pl-10"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-surface-border space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  {t('profile.newPassword')}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('profile.passwordPlaceholder')}
                    className="!pl-10"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="pt-6 border-t border-surface-border space-y-5">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Store className="w-5 h-5" />
                    <span className="text-sm font-semibold">{t('profile.storeInfo')}</span>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">{t('settingsPage.storeLogo')}</label>
                    <div className="flex items-center gap-4">
                      <div
                        onClick={() => logoInputRef.current?.click()}
                        className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-surface-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-all overflow-hidden group"
                      >
                        {displayStoreLogo ? (
                          <>
                            <img src={displayStoreLogo} alt="Logo" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Camera className="w-5 h-5 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <Image className="w-6 h-6" />
                            <span className="text-[10px]">{t('settingsPage.upload')}</span>
                          </div>
                        )}
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      {displayStoreLogo && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="p-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <p className="text-xs text-muted-foreground">{t('settingsPage.uploadHelp')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">
                        {t('settingsPage.storeName')}
                      </label>
                      <input
                        type="text"
                        value={displayStoreName}
                        onChange={(e) => setStoreNameOverride(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">
                        {t('settingsPage.phone')}
                      </label>
                      <input
                        type="text"
                        value={displayStorePhone}
                        onChange={(e) => setStorePhoneOverride(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-text-secondary">
                        {t('settingsPage.address')}
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                          type="text"
                          value={displayStoreAddress}
                          onChange={(e) => setStoreAddressOverride(e.target.value)}
                          className="!pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">
                        {t('settingsPage.currency')}
                      </label>
                      <div className="relative">
                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <select
                          value={displayCurrency}
                          onChange={(e) => setCurrencyOverride(e.target.value)}
                          className="!pl-10"
                        >
                          <option value="MRU">MRU</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">
                        {t('settingsPage.language')}
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <select
                          value={displayLanguage}
                          onChange={(e) => setLanguageOverride(e.target.value)}
                          className="!pl-10"
                        >
                          <option value="fr">Français</option>
                          <option value="ar">العربية</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-text-secondary">
                        {t('settingsPage.invoiceFooter')}
                      </label>
                      <div className="relative">
                        <ReceiptText className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <textarea
                          value={displayInvoiceFooter}
                          onChange={(e) => setInvoiceFooterOverride(e.target.value)}
                          rows={3}
                          className="!pl-10 !resize-none"
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
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98]"
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
