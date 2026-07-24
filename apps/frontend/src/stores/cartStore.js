import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  cartItems: [],
  selectedCustomer: null,
  paymentMethod: 'cash',
  
  // Add item or increment quantity
  addItem: (product) => {
    set((state) => {
      const existing = state.cartItems.find(item => item.productId === product._id);
      
      // Prevent adding more than available stock
      if (existing && existing.quantity >= product.quantity) {
        return state; 
      }
      if (!existing && product.quantity < 1) {
        return state;
      }

      if (existing) {
        return {
          cartItems: state.cartItems.map(item => 
            item.productId === product._id 
              ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice } 
              : item
          )
        };
      }
      
      return {
        cartItems: [...state.cartItems, {
          productId: product._id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
          total: product.price,
          maxStock: product.quantity
        }]
      };
    });
  },

  // Add item with specific quantity (for product picker)
  addItemWithQuantity: (product, qty) => {
    set((state) => {
      if (qty < 1 || product.quantity < 1) return state;
      const safeQty = Math.min(qty, product.quantity);
      const existing = state.cartItems.find(item => item.productId === product._id);

      if (existing) {
        const newQty = Math.min(existing.quantity + safeQty, product.quantity);
        return {
          cartItems: state.cartItems.map(item =>
            item.productId === product._id
              ? { ...item, quantity: newQty, total: newQty * item.unitPrice }
              : item
          )
        };
      }

      return {
        cartItems: [...state.cartItems, {
          productId: product._id,
          name: product.name,
          unitPrice: product.price,
          quantity: safeQty,
          total: safeQty * product.price,
          maxStock: product.quantity
        }]
      };
    });
  },

  // Decrease quantity or remove if 1
  removeItem: (productId) => {
    set((state) => {
      const existing = state.cartItems.find(item => item.productId === productId);
      if (!existing) return state;

      if (existing.quantity > 1) {
        return {
          cartItems: state.cartItems.map(item =>
            item.productId === productId
              ? { ...item, quantity: item.quantity - 1, total: (item.quantity - 1) * item.unitPrice }
              : item
          )
        };
      }
      
      return {
        cartItems: state.cartItems.filter(item => item.productId !== productId)
      };
    });
  },

  // Set absolute quantity
  setQuantity: (productId, qty) => {
    set((state) => {
      if (qty < 1) return state;
      return {
        cartItems: state.cartItems.map(item =>
          item.productId === productId
            ? { ...item, quantity: Math.min(qty, item.maxStock), total: Math.min(qty, item.maxStock) * item.unitPrice }
            : item
        )
      };
    });
  },

  setUnitPrice: (productId, price) => {
    set((state) => ({
      cartItems: state.cartItems.map(item => 
        item.productId === productId
          ? { ...item, unitPrice: price, total: item.quantity * price }
          : item
      )
    }));
  },

  deleteItem: (productId) => {
    set((state) => ({
      cartItems: state.cartItems.filter(item => item.productId !== productId)
    }));
  },

  setCustomer: (customer) => set({ selectedCustomer: customer }),
  
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  
  clearCart: () => set({ cartItems: [], selectedCustomer: null, paymentMethod: 'cash' }),

  getTotalAmount: () => {
    return get().cartItems.reduce((sum, item) => sum + item.total, 0);
  }
}));

export default useCartStore;
