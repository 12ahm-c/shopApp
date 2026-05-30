import { useState, useEffect } from 'react';
import { settingsApi } from '../../api/settings';
import { Loader2, Save, Store } from 'lucide-react';
import { formatPhoneNumber } from '../../lib/utils';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isActive = true;
    settingsApi.getSettings()
      .then(res => {
        if (isActive) {
          setSettings(res.data);
          setLoading(false);
        }
      })
      .catch(err => console.error(err));
    return () => { isActive = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
      setMessage('');
    try {
      const res = await settingsApi.updateSettings(settings);
      setSettings(res.data);
      setMessage('Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Store className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Store Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage your store's global configuration and details.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Store Name</span>
              <input 
                type="text" 
                name="storeName" 
                value={settings.storeName || ''} 
                onChange={handleChange} 
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white outline-none"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</span>
              <input 
                type="text" 
                name="storePhone" 
                value={formatPhoneNumber(settings.storePhone)} 
                onChange={handleChange} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white outline-none"
              />
            </label>

            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Store Address</span>
              <input 
                type="text" 
                name="storeAddress" 
                value={settings.storeAddress || ''} 
                onChange={handleChange} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white outline-none"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Currency</span>
              <select 
                name="currency" 
                value={settings.currency || 'MRU'} 
                onChange={handleChange} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white outline-none"
              >
                <option value="MRU">MRU</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Language</span>
              <select 
                name="language" 
                value={settings.language || 'fr'} 
                onChange={handleChange} 
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white outline-none"
              >
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>
            </label>

            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Invoice Footer</span>
              <textarea 
                name="invoiceFooter" 
                value={settings.invoiceFooter || ''} 
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-900 focus:ring-2 focus:ring-blue-500/50 dark:border-slate-800 dark:bg-slate-950 dark:text-white outline-none"
              />
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className={`text-sm font-medium ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </span>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-500/20 font-medium transition-all disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
