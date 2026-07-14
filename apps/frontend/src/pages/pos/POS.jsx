import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productApi } from '../../api/product';
import { customerApi } from '../../api/customer';
import { saleApi } from '../../api/sale';
import useCartStore from '../../stores/cartStore';
import { formatPhoneNumber } from '../../lib/utils';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, 
  Smartphone, Wallet, User, CheckCircle2, Loader2, RefreshCcw, Package, ReceiptText
} from 'lucide-react';
import { formatMoney } from '../../lib/format';
import Receipt from '../../components/Receipt';

const paymentLabels = {
  cash: 'payment.cash',
  card: 'payment.card',
  bankily: 'payment.bankily',
  alsadd: 'payment.alsadd',
  bimbank: 'payment.bimbank',
  masrafi: 'payment.masrafi'
};

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  bankily: Smartphone,
  alsadd: Wallet,
  bimbank: Smartphone,
  masrafi: Wallet
};

const PAYMENT_METHODS = ['cash', 'card', 'bankily', 'alsadd', 'bimbank', 'masrafi'];

export default function POS() {
  const { t } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const { 
    cartItems, addItem, removeItem, deleteItem, setUnitPrice,
    selectedCustomer, setCustomer, paymentMethod, setPaymentMethod, 
    clearCart, getTotalAmount 
  } = useCartStore();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  const productsLoaded = useRef(false);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!productsLoaded.current) productsLoaded.current = true;
      setLoadingProducts(true);
      try {
        const res = await productApi.getProducts({ search: searchQuery, limit: 10 });
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    if (!productsLoaded.current) {
      fetchProducts();
      return;
    }
    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

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
    <div className="h-[calc(100dvh-8rem)] sm:h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4 sm:gap-6">
      
      {/* Left side: Products catalog */}
      <div className="flex-1 flex flex-col bg-card rounded-2xl border border-surface-border overflow-hidden min-h-0">
        <div className="p-3 sm:p-4 border-b border-surface-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input 
              type="text" 
              placeholder={t('pos.searchProducts')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!pl-10 !pr-4 !py-3"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Package className="w-12 h-12 mb-2 opacity-20" />
              <p className="text-sm">{t('pos.noProducts')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {products.map(product => {
                const inCart = cartItems.find(i => i.productId === product._id);
                const isOutOfStock = product.quantity < 1;
                const canAdd = !isOutOfStock && (!inCart || inCart.quantity < product.quantity);

                return (
                  <button
                    key={product._id}
                    onClick={() => canAdd && addItem(product)}
                    disabled={!canAdd}
                    className={`text-left p-3 rounded-2xl border transition-all flex flex-col justify-between min-h-[100px] sm:min-h-[120px] ${
                      canAdd 
                        ? 'bg-card border-surface-border hover:border-primary/30 hover:bg-accent cursor-pointer active:scale-[0.98]' 
                        : 'bg-card border-surface-border opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <h3 className="font-medium text-text-primary line-clamp-2 text-xs sm:text-sm leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">{product.category}</p>
                    </div>
                    <div className="flex items-end justify-between w-full mt-2">
                      <span className="font-bold text-primary text-xs sm:text-sm tabular-nums">
                        {product.price} MRU
                      </span>
                      <span className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-lg ${
                        isOutOfStock ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-accent text-muted-foreground'
                      }`}>
                        {product.quantity}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Cart & Checkout */}
      <div className="w-full lg:w-96 flex flex-col bg-card rounded-2xl border border-surface-border overflow-hidden max-h-[50vh] sm:max-h-[60vh] lg:max-h-none">
        
        {/* Customer Selection */}
        <div className="p-4 border-b border-surface-border relative">
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
                <div className="absolute z-10 w-full mt-1 bg-surface border border-surface-border shadow-2xl rounded-xl overflow-hidden">
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 py-8">
              <ShoppingCart className="w-14 h-14 sm:w-16 sm:h-16 opacity-10" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.productId} className="flex flex-col gap-2 p-3 border border-surface-border rounded-xl bg-card">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm text-text-primary leading-tight pr-4 line-clamp-2">{item.name}</h4>
                  <button 
                    onClick={() => deleteItem(item.productId)}
                    className="p-1.5 text-muted-foreground hover:text-rose-600 dark:text-rose-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => setUnitPrice(item.productId, Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-16 sm:w-20 text-sm font-semibold text-primary bg-transparent border border-surface-border rounded-lg px-2 py-1.5 focus:outline-none tabular-nums"
                    />
                    <span className="text-xs text-muted-foreground">MRU</span>
                  </div>
                  <div className="flex items-center gap-2 bg-accent border border-surface-border rounded-lg p-0.5">
                    <button 
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 rounded-md hover:bg-surface-hover text-muted-foreground"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center text-text-primary tabular-nums">{item.quantity}</span>
                    <button 
                      onClick={() => addItem({ _id: item.productId, quantity: item.maxStock })}
                      disabled={item.quantity >= item.maxStock}
                      className="p-1.5 rounded-md hover:bg-surface-hover text-muted-foreground disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Section */}
        <div className="p-3 sm:p-4 border-t border-surface-border shrink-0">
          {checkoutError && (
            <div className="mb-3 p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-xl border border-rose-500/20">
              {checkoutError}
            </div>
          )}

          <div className="flex justify-between items-center mb-3">
            <span className="text-muted-foreground font-medium text-sm">{t('table.total')}</span>
            <span className="text-xl sm:text-2xl font-bold text-text-primary tabular-nums">
              {formatMoney(getTotalAmount())}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 gap-1.5 sm:gap-2 mb-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = paymentIcons[method];
              return (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2.5 px-1 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all ${
                    paymentMethod === method 
                      ? 'bg-primary/10 border-primary/30 text-primary' 
                      : 'bg-card border-surface-border text-muted-foreground hover:border-surface-border'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] sm:text-xs font-medium">{t(paymentLabels[method])}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isCheckingOut}
            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.98]"
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
      </div>
    </div>
  );
}
