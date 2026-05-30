import { create } from 'zustand';

const useProductStore = create((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  selectedCategory: '',
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  
  lowStockOnly: false,
  setLowStockOnly: (value) => set({ lowStockOnly: value }),

  clearFilters: () => set({ searchQuery: '', selectedCategory: '', lowStockOnly: false })
}));

export default useProductStore;
