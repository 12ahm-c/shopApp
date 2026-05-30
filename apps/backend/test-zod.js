const { z } = require('zod');
const normalizePhone = (phone) => {
  const trimmed = phone.trim().replace(/\s+/g, '');
  if (/^\+222\d{8}$/.test(trimmed)) return trimmed;
  if (/^\d{8}$/.test(trimmed)) return '+222' + trimmed;
  if (/^\+\d{8,15}$/.test(trimmed)) return trimmed;
  return trimmed;
};
const isValidPhone = (phone) => /^\+222\d{8}$/.test(phone) || /^\+\d{8,15}$/.test(phone);
const loginSchema = z.object({
  phone: z.string().transform(normalizePhone).refine(isValidPhone, 'Invalid phone number'),
  password: z.string().min(6)
});
for (const test of ['+22236123456', '36123456', '22236123456', '+222 36 123 456']) {
  const r = loginSchema.safeParse({ phone: test, password: 'AdminPass123!' });
  console.log(test, '->', JSON.stringify({ success: r.success, data: r.data?.phone, error: r.error?.issues?.[0]?.message }));
}
