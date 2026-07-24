import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../api/product';
import { customerApi } from '../../api/customer';
import { saleApi } from '../../api/sale';
import { employeeApi } from '../../api/employee';
import useCartStore from '../../stores/cartStore';
import useAuthStore from '../../stores/authStore';
import { formatPhoneNumber } from '../../lib/utils';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, X,
  User, CheckCircle2, Loader2, RefreshCcw, Package, ReceiptText,
  CalendarDays, Eye, Filter, SearchX, ShoppingCart as CartIcon
} from 'lucide-react';
import { formatMoney, formatDateTime } from '../../lib/format';
import Receipt from '../../components/Receipt';

const paymentLabels = {
  cash: 'payment.cash',
  card: 'payment.card',
  bankily: 'payment.bankily',
  alsadd: 'payment.alsadd',
  bimbank: 'payment.bimbank',
  masrafi: 'payment.masrafi'
};

const paymentImages = {
  cash: '/icons/cash.svg',
  card: '/icons/card.svg',
  bankily: '/icons/2.jpeg',
  alsadd: '/icons/3.jpeg',
  bimbank: '/icons/4.jpeg',
  masrafi: '/icons/1.jpeg'
};

const PAYMENT_METHODS = ['cash', 'card', 'bankily', 'alsadd', 'bimbank', 'masrafi'];

const toStartOfDay = (date) => date ? `${date}T00:00:00.000Z` : '';
const toEndOfDay = (date) => date ? `${date}T23:59:59.999Z` : '';

function SalesHistory() {
  const { t } = useTranslation();
  const role = useAuthStore((state) => state.role);
  const isAdmin = role === 'admin';

  const [filters, setFilters] = useState({
    from: '',
    to: '',
    employeeId: '',
    paymentMethod: ''
  });

  const [invoicesState, setInvoicesState] = useState({
    status: 'loading',
    data: [],
    error: null
  });
  const [employeesState, setEmployeesState] = useState({
    status: 'idle',
    data: []
  });

  const requestParams = useMemo(() => ({
    page: 1,
    limit: 20,
    from: toStartOfDay(filters.from),
    to: toEndOfDay(filters.to),
    employeeId: isAdmin ? filters.employeeId : '',
    paymentMethod: filters.paymentMethod || ''
  }), [filters, isAdmin]);

  const loadInvoices = useCallback(async () => {
    setInvoicesState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const response = await saleApi.getSales(requestParams);
      setInvoicesState({
        status: 'success',
        data: response.data,
        error: null
      });
    } catch (error) {
      setInvoicesState({
        status: 'error',
        data: [],
        error: error.message || t('sales.noInvoices')
      });
    }
  }, [requestParams, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadInvoices();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadInvoices]);

  useEffect(() => {
    if (!isAdmin || employeesState.status !== 'idle') return;
    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      setEmployeesState({ status: 'loading', data: [] });
      employeeApi.getEmployees({ page: 1, limit: 100 })
        .then((response) => {
          if (isActive) {
            setEmployeesState({ status: 'success', data: response.data });
          }
        })
        .catch(() => {
          if (isActive) {
            setEmployeesState({ status: 'error', data: [] });
          }
        });
    }, 0);
    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [employeesState.status, isAdmin]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ from: '', to: '', employeeId: '', paymentMethod: '' });
  };

  const totalVisible = invoicesState.data.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-xl border border-surface-border bg-card px-4 py-2.5 text-sm font-semibold text-text-primary tabular-nums">
          {t('sales.totalVisible')}: {formatMoney(totalVisible)}
        </div>
      </div>

      <section className="rounded-2xl border border-surface-border bg-card p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Filter className="h-4 w-4" />
          {t('sales.filters')}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('sales.from')}</span>
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="max-w-[200px]"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('sales.to')}</span>
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="max-w-[200px]"
            />
          </label>
          {isAdmin && (
            <label className="block space-y-1">
              <span className="text-xs font-medium text-text-secondary">{t('sales.employee')}</span>
              <select
                name="employeeId"
                value={filters.employeeId}
                onChange={handleFilterChange}
                className="max-w-[200px]"
              >
                <option value="">{t('sales.allEmployees')}</option>
                {employeesState.data.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block space-y-1">
            <span className="text-xs font-medium text-text-secondary">{t('invoice.paymentMethod')}</span>
            <select
              name="paymentMethod"
              value={filters.paymentMethod}
              onChange={handleFilterChange}
              className="max-w-[200px]"
            >
              <option value="">{t('sales.allPaymentMethods')}</option>
              <option value="cash">{t('payment.cash')}</option>
              <option value="card">{t('payment.card')}</option>
              <option value="bankily">{t('payment.bankily')}</option>
              <option value="alsadd">{t('payment.alsadd')}</option>
              <option value="bimbank">{t('payment.bimbank')}</option>
              <option value="masrafi">{t('payment.masrafi')}</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent active:scale-[0.97]"
          >
            <SearchX className="h-4 w-4" />
            {t('sales.reset')}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-surface-border bg-card">
        {invoicesState.status === 'loading' && (
          <div className="flex items-center justify-center p-10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}
        {invoicesState.status === 'error' && (
          <div className="p-6 text-sm text-rose-600 dark:text-rose-400">{invoicesState.error}</div>
        )}
        {invoicesState.status === 'success' && invoicesState.data.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">{t('sales.noInvoices')}</div>
        )}
        {invoicesState.status === 'success' && invoicesState.data.length > 0 && (
          <>
            <div className="sm:hidden divide-y divide-surface-border">
              {invoicesState.data.map((invoice) => (
                <Link
                  key={invoice._id}
                  to={`/invoices/${invoice._id}`}
                  className="block px-4 py-3 hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-text-primary text-sm">#{invoice.invoiceNumber}</div>
                    <div className="font-bold text-sm text-text-primary tabular-nums">{formatMoney(invoice.totalAmount)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{invoice.customerName}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(invoice.createdAt)}</div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">{t('table.invoice')}</th>
                    <th className="px-6 py-4 font-medium">{t('table.client')}</th>
                    <th className="px-6 py-4 font-medium">{t('table.employee')}</th>
                    <th className="px-6 py-4 font-medium">{t('table.payment')}</th>
                    <th className="px-6 py-4 text-right font-medium">{t('table.total')}</th>
                    <th className="px-6 py-4 text-right font-medium">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {invoicesState.data.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-accent">
                      <td className="px-6 py-4 min-w-[130px]">
                        <div className="font-semibold text-text-primary text-base">#{invoice.invoiceNumber}</div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{formatDateTime(invoice.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">{invoice.customerName}</td>
                      <td className="px-6 py-4 text-text-secondary">{invoice.employeeName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{t(paymentLabels[invoice.paymentMethod] || invoice.paymentMethod)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-text-primary text-base whitespace-nowrap tabular-nums">{formatMoney(invoice.totalAmount)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/invoices/${invoice._id}`}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ProductPicker({ isOpen, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery('');
    setSelectedProducts({});
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    const fetch = async () => {
      try {
        const res = await productApi.getProducts({
          search: searchQuery,
          limit: 50
        });
        if (active) setProducts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    const timeout = setTimeout(fetch, 300);
    return () => { active = false; clearTimeout(timeout); };
  }, [searchQuery, isOpen]);

  const toggleQuantity = (product, delta) => {
    setSelectedProducts(prev => {
      const current = prev[product._id]?.qty || 0;
      const newQty = Math.max(0, Math.min(current + delta, product.quantity));
      const next = { ...prev };
      if (newQty === 0) {
        delete next[product._id];
      } else {
        next[product._id] = { product, qty: newQty };
      }
      return next;
    });
  };

  const setDirectQty = (product, qty) => {
    const n = parseInt(qty) || 0;
    setSelectedProducts(prev => {
      const next = { ...prev };
      if (n <= 0) {
        delete next[product._id];
      } else {
        next[product._id] = { product, qty: Math.min(n, product.quantity) };
      }
      return next;
    });
  };

  const totalSelected = Object.values(selectedProducts).reduce((s, i) => s + i.qty, 0);

  const handleConfirm = () => {
    const items = Object.values(selectedProducts);
    items.forEach(({ product, qty }) => onConfirm(product, qty));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-2xl border border-surface-border shadow-2xl flex flex-col max-h-[90vh] animate-slide-up sm:animate-slide-down">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border shrink-0">
          <h2 className="text-base font-bold text-text-primary">{t('pos.productPickerTitle')}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder={t('pos.searchHint')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!pl-9 !pr-4 !py-2.5 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">{t('pos.noProducts')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(product => {
                const isOutOfStock = product.quantity < 1;
                const selectedQty = selectedProducts[product._id]?.qty || 0;

                return (
                  <div
                    key={product._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedQty > 0
                        ? 'border-primary/30 bg-primary/5'
                        : isOutOfStock
                          ? 'border-surface-border opacity-50'
                          : 'border-surface-border hover:border-primary/20'
                    }`}
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-text-primary truncate">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-primary tabular-nums">{product.price} MRU</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          isOutOfStock ? 'bg-rose-500/10 text-rose-600' : 'bg-accent text-muted-foreground'
                        }`}>
                          {isOutOfStock ? t('pos.outOfStock') : `${product.quantity} ${t('pos.inStock')}`}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    {!isOutOfStock && (
                      <div className="flex items-center gap-1.5">
                        {selectedQty > 0 && (
                          <>
                            <button
                              onClick={() => toggleQuantity(product, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent hover:bg-secondary text-muted-foreground transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={product.quantity}
                              value={selectedQty}
                              onChange={(e) => setDirectQty(product, e.target.value)}
                              className="w-12 h-8 text-center text-sm font-semibold bg-transparent border border-surface-border rounded-lg focus:outline-none tabular-nums"
                            />
                          </>
                        )}
                        <button
                          onClick={() => toggleQuantity(product, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm shadow-primary/25"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-surface-border shrink-0 flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {totalSelected > 0
              ? t('pos.selected', { count: totalSelected })
              : t('pos.noItemsSelected')
            }
          </span>
          <button
            onClick={handleConfirm}
            disabled={totalSelected === 0}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {t('pos.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

function POSTab() {
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);

  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const { 
    cartItems, addItem, removeItem, deleteItem, setUnitPrice, addItemWithQuantity,
    selectedCustomer, setCustomer, paymentMethod, setPaymentMethod, 
    clearCart, getTotalAmount 
  } = useCartStore();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  const [editingPrice, setEditingPrice] = useState({ id: null, value: '' });

  useEffect(() => {
    if (!customerSearch) {
      setCustomers([]);
      return;
    }
    const fetchCustomers = async () => {
      try {
        const res = await customerApi.getCustomers({ search: customerSearch });
        setCustomers(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const timeout = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timeout);
  }, [customerSearch]);

  const handlePickerConfirm = (product, qty) => {
    addItemWithQuantity(product, qty);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      const payload = {
        items: cartItems.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        })),
        customerId: selectedCustomer?._id,
        customerName: selectedCustomer?.name || t('pos.walkIn'),
        paymentMethod
      };
      const res = await saleApi.createSale(payload);
      setReceiptData(res.data.sale);
      setCheckoutSuccess(true);
      clearCart();
    } catch (err) {
      setCheckoutError(err?.response?.data?.error?.message || t('pos.checkoutFailed'));
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleNewSale = () => {
    setCheckoutSuccess(false);
    setReceiptData(null);
    clearCart();
  };

  if (checkoutSuccess && receiptData) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">{t('pos.saleComplete')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('pos.invoiceGenerated', { number: receiptData.invoiceNumber })}
              </p>
            </div>
          </div>
        </div>
        <Receipt data={receiptData} />
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={handleNewSale}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
          >
            <RefreshCcw className="h-5 w-5" />
            {t('pos.newSale')}
          </button>
          <Link
            to={`/invoices/${receiptData._id}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent border border-surface-border px-5 py-3 text-sm font-semibold text-text-secondary hover:bg-surface-hover transition-all"
          >
            <ReceiptText className="h-5 w-5" />
            {t('pos.viewDetail')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto flex flex-col gap-4">

        {/* Add Products Button */}
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary font-semibold text-sm hover:bg-primary/10 hover:border-primary/50 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          {t('pos.addProducts')}
        </button>

        {/* Customer Selection */}
        <div className="bg-card rounded-2xl border border-surface-border p-4 relative">
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-primary/10 p-3 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-text-primary">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPhoneNumber(selectedCustomer.phone)}</p>
                </div>
              </div>
              <button
                onClick={() => setCustomer(null)}
                className="p-2 hover:bg-surface-hover rounded-xl text-muted-foreground hover:text-rose-600 dark:text-rose-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder={t('pos.searchCustomer')}
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="!px-4 !py-2.5"
              />
              {showCustomerDropdown && customers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-surface-border shadow-2xl rounded-xl overflow-hidden">
                  {customers.map(c => (
                    <button
                      key={c._id}
                      onClick={() => {
                        setCustomer(c);
                        setCustomerSearch('');
                        setShowCustomerDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex justify-between items-center"
                    >
                      <span className="font-medium text-sm text-text-primary">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{formatPhoneNumber(c.phone)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="bg-card rounded-2xl border border-surface-border overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <ShoppingCart className="w-4 h-4" />
              {t('table.total')}
            </div>
            <span className="text-lg font-bold text-text-primary tabular-nums">
              {formatMoney(getTotalAmount())}
            </span>
          </div>

          <div className="divide-y divide-surface-border max-h-[40vh] overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground py-10 space-y-2">
                <ShoppingCart className="w-12 h-12 opacity-10" />
                <p className="text-sm">{t('posPage.cartEmpty')}</p>
              </div>
            ) : (
              cartItems.map(item => (
                <div key={item.productId} className="flex items-center gap-3 p-3 sm:p-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-text-primary truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={editingPrice.id === item.productId ? editingPrice.value : item.unitPrice}
                        onFocus={() => setEditingPrice({ id: item.productId, value: '' })}
                        onChange={(e) => setEditingPrice({ id: item.productId, value: e.target.value })}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setUnitPrice(item.productId, Math.max(0, val));
                          setEditingPrice({ id: null, value: '' });
                        }}
                        className="w-16 text-xs font-semibold text-primary bg-transparent border border-surface-border rounded-lg px-2 py-1 focus:outline-none tabular-nums"
                      />
                      <span className="text-[10px] text-muted-foreground">MRU</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-accent border border-surface-border rounded-lg p-0.5">
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 rounded-md hover:bg-surface-hover text-muted-foreground"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center text-text-primary tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => addItem({ _id: item.productId, quantity: item.maxStock })}
                      disabled={item.quantity >= item.maxStock}
                      className="p-1.5 rounded-md hover:bg-surface-hover text-muted-foreground disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => deleteItem(item.productId)}
                    className="p-1.5 text-muted-foreground hover:text-rose-600 dark:text-rose-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Methods */}
        {cartItems.length > 0 && (
          <div className="bg-card rounded-2xl border border-surface-border p-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2.5 px-1 flex flex-col items-center justify-center gap-1.5 rounded-xl border transition-all ${
                    paymentMethod === method
                      ? 'bg-primary/10 border-primary/30 text-primary ring-2 ring-primary/20'
                      : 'bg-card border-surface-border text-muted-foreground hover:border-surface-border'
                  }`}
                >
                  <img src={paymentImages[method]} alt={t(paymentLabels[method])} className="w-7 h-7 object-contain rounded-lg" />
                  <span className="text-[10px] font-medium">{t(paymentLabels[method])}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Checkout Error */}
        {checkoutError && (
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-xl border border-rose-500/20">
            {checkoutError}
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={cartItems.length === 0 || isCheckingOut}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
        >
          {isCheckingOut ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('pos.processing')}...
            </>
          ) : (
            <>
              {t('pos.checkout')} {cartItems.length > 0 && `(${cartItems.length})`}
            </>
          )}
        </button>
      </div>

      <ProductPicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onConfirm={handlePickerConfirm}
      />
    </>
  );
}

export default function POS() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('pos');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 p-1 bg-card rounded-2xl border border-surface-border">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'pos'
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <CartIcon className="w-4 h-4" />
          {t('sales.tabPOS')}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'text-muted-foreground hover:bg-accent'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          {t('sales.tabHistory')}
        </button>
      </div>

      {activeTab === 'pos' ? <POSTab /> : <SalesHistory />}
    </div>
  );
}
