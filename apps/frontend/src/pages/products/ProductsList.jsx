import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../../api/product';
import useAuthStore from '../../stores/authStore';
import useProductStore from '../../stores/productStore';
import { Search, Plus, Filter, AlertTriangle, Loader2, Package, Eye } from 'lucide-react';

export default function ProductsList() {
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
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-950/40 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            Product Catalog
          </h1>
          <p className="text-slate-500 text-sm mt-1 ml-12">Manage your store's inventory and products.</p>
        </div>
        
        {role === 'admin' && (
          <Link
            to="/products/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl shadow-sm transition-all shadow-green-500/20 active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-9 pr-8 py-2.5 appearance-none bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="">All Categories</option>
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
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-500"></div>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Low Stock
              </span>
            </label>
          </div>
        </div>

        {/* Products Grid/Table */}
        <div className="overflow-x-auto">
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-500" />
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No products found.
              </div>
            ) : (
              products.map(product => {
                const isLowStock = product.quantity <= product.alertThreshold;
                return (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-950/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-900 dark:text-white truncate">{product.name}</span>
                        {isLowStock && <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">{product.category}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          isLowStock 
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' 
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        }`}>
                          {product.quantity} in stock
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0">
                      {product.price.toLocaleString()} MRU
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          {/* Desktop Table View */}
          <table className="w-full text-sm text-left hidden sm:table">
            <thead className="bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 sm:px-6 py-4">Product Name</th>
                <th className="px-3 sm:px-6 py-4 hidden sm:table-cell">Category</th>
                <th className="px-3 sm:px-6 py-4 text-right">Price (MRU)</th>
                <th className="px-3 sm:px-6 py-4 text-right">Stock</th>
                <th className="px-3 sm:px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 sm:px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-500" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 sm:px-6 py-12 text-center text-slate-500">
                    No products found matching your filters.
                  </td>
                </tr>
              ) : (
                products.map(product => {
                  const isLowStock = product.quantity <= product.alertThreshold;
                  return (
                    <tr key={product._id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors group">
                      <td className="px-3 sm:px-6 py-4 min-w-[120px]">
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                          {product.name}
                          {isLowStock && <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" title="Low stock" />}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                        {product.category}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {product.price.toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          isLowStock 
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50'
                        }`}>
                          {product.quantity}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-center">
                        <Link 
                          to={`/products/${product._id}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-slate-800 dark:hover:text-green-400 transition-colors"
                          title="View Details"
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
