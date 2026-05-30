const { z } = require('zod');
const createSaleItemSchema = z.object({
  productId: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid productId'),
  quantity: z.number().int().min(1),
  unitPrice: z.number().int().min(0)
});
const createSaleSchema = z.object({
  items: z.array(createSaleItemSchema).min(1, 'At least one item is required'),
  customerId: z.string().regex(/^[a-f0-9]{24}$/, 'Invalid customerId').optional(),
  customerName: z.string().trim().min(1).max(100),
  paymentMethod: z.enum(['cash', 'card', 'bankily'])
});

// Test 1: Missing customerName
const r1 = createSaleSchema.safeParse({
  items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1, unitPrice: 1500 }],
  paymentMethod: 'cash'
});
console.log('Test 1 (no customerName):');
if (!r1.success) {
  const flat = z.flattenError(r1.error);
  console.log('  fieldErrors:', JSON.stringify(flat.fieldErrors));
}

// Test 2: customerName is null
const r2 = createSaleSchema.safeParse({
  items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1, unitPrice: 1500 }],
  customerName: null,
  paymentMethod: 'cash'
});
console.log('Test 2 (null customerName):');
if (!r2.success) {
  const flat = z.flattenError(r2.error);
  console.log('  fieldErrors:', JSON.stringify(flat.fieldErrors));
}

// Test 3: quantity as string
const r3 = createSaleSchema.safeParse({
  items: [{ productId: '507f1f77bcf86cd799439011', quantity: '1', unitPrice: 1500 }],
  customerName: 'Test Customer',
  paymentMethod: 'cash'
});
console.log('Test 3 (string quantity):');
if (!r3.success) {
  const flat = z.flattenError(r3.error);
  console.log('  fieldErrors:', JSON.stringify(flat.fieldErrors));
}

// Test 4: unitPrice as float
const r4 = createSaleSchema.safeParse({
  items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1, unitPrice: 1500.50 }],
  customerName: 'Test Customer',
  paymentMethod: 'cash'
});
console.log('Test 4 (float unitPrice):');
if (!r4.success) {
  const flat = z.flattenError(r4.error);
  console.log('  fieldErrors:', JSON.stringify(flat.fieldErrors));
}
