import { customerPayloadSchema, productPayloadSchema } from '../pos';

describe('customerPayloadSchema', () => {
  test('accepts a minimal valid customer', () => {
    const result = customerPayloadSchema.safeParse({ customerName: 'Ali' });
    expect(result.success).toBe(true);
  });

  test('rejects a blank customer name', () => {
    const result = customerPayloadSchema.safeParse({ customerName: '  ' });
    expect(result.success).toBe(false);
  });
});

describe('productPayloadSchema', () => {
  test('accepts a valid product', () => {
    const result = productPayloadSchema.safeParse({
      productName: 'Shirt',
      category: 'Uniform',
      size: 'M',
      sellPrice: 500,
      wholesalePrice: 300,
      productCost: 250,
    });
    expect(result.success).toBe(true);
  });

  test('rejects a negative sell price', () => {
    const result = productPayloadSchema.safeParse({
      productName: 'Shirt',
      category: 'Uniform',
      size: 'M',
      sellPrice: -1,
      wholesalePrice: 300,
      productCost: 250,
    });
    expect(result.success).toBe(false);
  });
});
