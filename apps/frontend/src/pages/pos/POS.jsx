import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../../api/product';
import { customerApi } from '../../api/customer';
import { saleApi } from '../../api/sale';
import useCartStore from '../../stores/cartStore';
import { formatPhoneNumber } from '../../lib/utils';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, 
  Smartphone, User, CheckCircle2, Loader2, RefreshCcw, Package, ReceiptText
} from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('fr-FR');

const formatMoney = (amount) => `${currencyFormatter.format(Number(amount || 0))} MRU`;

const formatDateTime = (isoDate) => {
  if (!isoDate) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoDate));
};

const paymentLabels = {
  cash: 'Cash',
  card: 'Carte',
  bankily: 'Bankily'
};

export default function POS() {
  
  // Products Search
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Customers Search
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Cart Store
  const { 
    cartItems, addItem, removeItem, deleteItem, 
    selectedCustomer, setCustomer, paymentMethod, setPaymentMethod, 
    clearCart, getTotalAmount 
  } = useCartStore();

  // Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  // Fetch Products on search change
  useEffect(() => {
    const fetchProducts = async () => {
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
    
    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Fetch Customers on search change
  useEffect(() => {
    if (!customerSearch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        customerName: selectedCustomer?.name,
        paymentMethod
      };

      const res = await saleApi.createSale(payload);
      setReceiptData(res.data.sale);
      setCheckoutSuccess(true);
      clearCart();
    } catch (err) {
      setCheckoutError(err?.response?.data?.error?.message || 'Checkout failed');
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
      <div className="mx-auto mt-8 max-w-3xl space-y-5">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Vente terminee</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Facture #{receiptData.invoiceNumber} generee depuis le POS.
              </p>
            </div>
          </div>
        </div>

        <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <header className="border-b border-slate-200 p-5 dark:border-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  <ReceiptText className="h-4 w-4" />
                  Facture POS
                </div>
                <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  #{receiptData.invoiceNumber}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{formatDateTime(receiptData.createdAt)}</p>
              </div>

              <div className="grid gap-2 text-sm sm:text-right">
                <div>
                  <span className="block text-slate-500">Client</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{receiptData.customerName}</span>
                </div>
                <div>
                  <span className="block text-slate-500">Paiement</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {paymentLabels[receiptData.paymentMethod] || receiptData.paymentMethod}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Produit</th>
                  <th className="px-5 py-3 text-right font-medium">Qté</th>
                  <th className="px-5 py-3 text-right font-medium">Prix payé</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {receiptData.items.map((item) => (
                  <tr key={`${item.productId}-${item.name}`}>
                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">{item.name}</td>
                    <td className="px-5 py-4 text-right text-slate-700 dark:text-slate-300">{item.quantity}</td>
                    <td className="px-5 py-4 text-right text-slate-700 dark:text-slate-300">{formatMoney(item.unitPrice)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900 dark:text-white">{formatMoney(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-950/50">
                <tr>
                  <td className="px-5 py-4 text-right font-semibold text-slate-900 dark:text-white" colSpan="3">
                    Total general
                  </td>
                  <td className="px-5 py-4 text-right text-lg font-bold text-slate-900 dark:text-white">
                    {formatMoney(receiptData.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </article>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleNewSale}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <RefreshCcw className="h-5 w-5" />
            Nouvelle vente
          </button>
          <Link
            to={`/invoices/${receiptData._id}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ReceiptText className="h-5 w-5" />
            Voir le detail
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      
      {/* Left side: Products catalog */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products by name or barcode..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Package className="w-12 h-12 mb-2 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(product => {
                const inCart = cartItems.find(i => i.productId === product._id);
                const isOutOfStock = product.quantity < 1;
                const canAdd = !isOutOfStock && (!inCart || inCart.quantity < product.quantity);

                return (
                  <button
                    key={product._id}
                    onClick={() => canAdd && addItem(product)}
                    disabled={!canAdd}
                    className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between h-32 ${
                      canAdd 
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-md cursor-pointer group' 
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white line-clamp-2 text-sm">
                        {product.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{product.category}</p>
                    </div>
                    <div className="flex items-end justify-between w-full mt-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {product.price} MRU
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isOutOfStock ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {product.quantity} left
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
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Customer Selection */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 relative">
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-sm text-blue-900 dark:text-blue-100">{selectedCustomer.name}</p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-300/80">{formatPhoneNumber(selectedCustomer.phone)}</p>
                </div>
              </div>
              <button 
                onClick={() => setCustomer(null)}
                className="p-1.5 hover:bg-blue-200/50 dark:hover:bg-blue-800/50 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                placeholder="Search or add customer..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              {showCustomerDropdown && customers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl overflow-hidden">
                  {customers.map(c => (
                    <button
                      key={c._id}
                      onClick={() => {
                        setCustomer(c);
                        setCustomerSearch('');
                        setShowCustomerDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex justify-between items-center"
                    >
                      <span className="font-medium text-sm text-slate-900 dark:text-white">{c.name}</span>
                      <span className="text-xs text-slate-500">{formatPhoneNumber(c.phone)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <ShoppingCart className="w-16 h-16 opacity-20" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.productId} className="flex flex-col gap-2 p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/50">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm text-slate-900 dark:text-white leading-tight pr-4">{item.name}</h4>
                  <button 
                    onClick={() => deleteItem(item.productId)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{item.unitPrice} MRU</span>
                  <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                    <button 
                      onClick={() => removeItem(item.productId)}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                    <button 
                      onClick={() => addItem({ _id: item.productId, quantity: item.maxStock })}
                      disabled={item.quantity >= item.maxStock}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
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
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          {checkoutError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-900/50">
              {checkoutError}
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-500 font-medium">Total</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {getTotalAmount().toLocaleString()} <span className="text-base text-slate-500 font-medium">MRU</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`py-2 px-1 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all ${
                paymentMethod === 'cash' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span className="text-xs font-medium">Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`py-2 px-1 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all ${
                paymentMethod === 'card' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-medium">Card</span>
            </button>
            <button
              onClick={() => setPaymentMethod('bankily')}
              className={`py-2 px-1 flex flex-col items-center justify-center gap-1 rounded-xl border transition-all ${
                paymentMethod === 'bankily' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-300'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-xs font-medium">Bankily</span>
            </button>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || isCheckingOut}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Checkout {cartItems.length > 0 && `(${cartItems.length})`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
