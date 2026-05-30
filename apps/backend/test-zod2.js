const { z } = require('zod');
// Check if z.flattenError exists
console.log('z.flattenError:', typeof z.flattenError);

// Check if result.error.flatten exists
const schema = z.object({ name: z.string().min(3) });
const result = schema.safeParse({ name: 'ab' });
if (!result.success) {
  console.log('flatten method exists:', typeof result.error.flatten);
  const flat = result.error.flatten();
  console.log('flattened:', JSON.stringify(flat));
}
