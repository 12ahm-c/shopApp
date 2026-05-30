// src/api/mocks/product.js

let mockProducts = [
  {
    _id: "65f2a1b3c4d5e6f7a8b9c0d1",
    name: "Café Torréfaction Maison 250g",
    category: "Épicerie",
    price: 450,
    quantity: 23,
    alertThreshold: 5,
    createdAt: "2025-05-16T14:32:11.000Z",
    updatedAt: "2025-06-15T09:12:00.000Z"
  },
  {
    _id: "65f2a1b3c4d5e6f7a8b9c0d2",
    name: "Sucre 1kg",
    category: "Épicerie",
    price: 80,
    quantity: 3,
    alertThreshold: 10,
    createdAt: "2025-05-16T14:32:11.000Z",
    updatedAt: "2025-06-15T09:12:00.000Z"
  }
];

export const mockProductApi = {
  getProducts: async (params = {}) => {
    const { page = 1, limit = 20, category, lowStock, search } = params;
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filtered = [...mockProducts];
    
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    if (lowStock) {
      filtered = filtered.filter(p => p.quantity <= p.alertThreshold);
    }
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(query));
    }
    
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);
    
    return {
      success: true,
      data: paginated,
      error: null,
      meta: {
        page,
        limit,
        total: filtered.length
      }
    };
  },

  getProductById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const product = mockProducts.find(p => p._id === id);
    if (!product) {
      throw {
        response: {
          data: {
            success: false,
            error: { code: "NOT_FOUND", message: "Product does not exist" }
          }
        }
      };
    }
    return {
      success: true,
      data: product,
      error: null,
      meta: null
    };
  },
  
  createProduct: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    if (mockProducts.some(p => p.name.toLowerCase() === data.name.toLowerCase())) {
      throw {
        response: {
          data: {
            success: false,
            error: { code: "DUPLICATE", message: "Product name already exists" }
          }
        }
      };
    }
    
    const suffix = (mockProducts.length + 1).toString(16).padStart(8, '0');
    const basePrefix = "65f2a1b3c4d5e6f7a8b9c000".slice(0, 24 - suffix.length);
    const newProduct = {
      _id: `${basePrefix}${suffix}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockProducts.push(newProduct);
    return {
      success: true,
      data: newProduct,
      error: null,
      meta: null
    };
  },

  updateProduct: async (id, data) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = mockProducts.findIndex(p => p._id === id);
    if (index === -1) {
      throw { response: { data: { error: { code: "NOT_FOUND" } } } };
    }
    
    mockProducts[index] = {
      ...mockProducts[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      data: mockProducts[index],
      error: null,
      meta: null
    };
  },

  deleteProduct: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = mockProducts.findIndex(p => p._id === id);
    if (index === -1) {
      throw { response: { data: { error: { code: "NOT_FOUND" } } } };
    }
    
    // For mock purposes, assume we can always delete unless we hardcode an ID that fails
    if (id === 'linked-sale-id-mock') {
       throw {
        response: {
          data: {
            success: false,
            error: { code: "INVALID_STATE", message: "Product has existing sales" }
          }
        }
      };
    }

    mockProducts.splice(index, 1);
    
    return {
      success: true,
      data: null,
      error: null,
      meta: null
    };
  }
};
