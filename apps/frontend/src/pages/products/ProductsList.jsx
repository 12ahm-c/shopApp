import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../api/product';
import useAuthStore from '../../stores/authStore';
import useProductStore from '../../stores/productStore';
import { Search, Plus, Filter, AlertTriangle, Loader2, Package, Eye } from 'lucide-react';

export default function ProductsList() {
  const { t } = useTranslation();
  const role = useAuthStore(state => state.role);
  
  const { 
    searchQuery, setSearchQuery, 
    selectedCategory, setSelectedCategory,
    lowStockOnly, setLowStockOnly
  } = useProductStore();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const categories = ['Épicerie', 'Électronique', 'Vêtements', 'Autre'];

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productApi.getProducts({
        search: searchQuery,
        category: selectedCategory || undefined,
        lowStock: lowStockOnly || undefined,
        limit: 50
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, lowStockOnly]);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadProducts();
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadProducts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            {t('productPage.catalog')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 ml-12">{t('productPage.manageInventory')}</p>
        </div>
        
        {role === 'admin' && (
          <Link
            to="/products/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            {t('productPage.addProduct')}
          </Link>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-surface-border overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-surface-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('productPage.search')}
              className="!pl-9 !pr-4 !py-2.5"
            />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="!pl-9 !pr-8 !py-2.5 !appearance-none !rounded-xl !text-sm !font-medium"
              >
                <option value="">{t('productPage.allCategories')}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
              <div className="relative inline-flex items-center">
                <input 
                  type="checkbox" 
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </div>
              <span className="text-sm font-medium text-text-secondary flex items-center gap-1.5 whitespace-nowrap">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {t('productPage.lowStock')}
              </span>
            </label>
          </div>
        </div>

        {/* Products Grid/Table */}
        <div className="overflow-x-auto">
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-surface-border">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {t('productPage.noProducts')}
              </div>
            ) : (
              products.map(product => {
                const isLowStock = product.quantity <= product.alertThreshold;
                return (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-text-primary truncate">{product.name}</span>
                        {isLowStock && <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">{product.category}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-lg ${
                          isLowStock 
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {product.quantity} {t('productPage.inStock')}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0 tabular-nums">
                      {product.price.toLocaleString()} MRU
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          {/* Desktop Table View */}
          <table className="w-full text-sm text-left hidden sm:table">
            <thead className="text-muted-foreground font-medium">
              <tr>
                <th className="px-3 sm:px-6 py-4">{t('productPage.productName')}</th>
                <th className="px-3 sm:px-6 py-4 hidden sm:table-cell">{t('productPage.category')}</th>
                <th className="px-3 sm:px-6 py-4 text-right">{t('productPage.price')}</th>
                <th className="px-3 sm:px-6 py-4 text-right">{t('productPage.stock')}</th>
                <th className="px-3 sm:px-6 py-4 text-center">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 sm:px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 sm:px-6 py-12 text-center text-muted-foreground">
                    {t('productPage.noProductsMatch')}
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const isLowStock = product.quantity <= product.alertThreshold;
                  return (
                    <tr key={product._id} className="hover:bg-accent transition-colors group">
                      <td className="px-3 sm:px-6 py-4 min-w-[120px]">
                        <div className="font-medium text-text-primary flex items-center gap-2 text-sm">
                          {product.name}
                          {isLowStock && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" title="Low stock" />}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-muted-foreground hidden sm:table-cell">
                        {product.category}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right font-medium text-text-primary whitespace-nowrap tabular-nums">
                        {product.price.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${
                          isLowStock 
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {product.quantity}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-center">
                        <Link 
                          to={`/products/${product._id}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title={t('productPage.viewDetails')}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}