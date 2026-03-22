describe('env config', () => {
  it('should have JWT_SECRET from setup', () => {
    expect(process.env.JWT_SECRET).toBe('test-secret-key-for-jest');
  });

  it('should have PORT set', () => {
    expect(process.env.PORT).toBeDefined();
  });

  it('should load env module without throwing', () => {
    expect(() => require('../../config/env')).not.toThrow();
  });

  it('should have expected env properties', () => {
    const { env } = require('../../config/env');
    expect(env.JWT_SECRET).toBe('test-secret-key-for-jest');
    expect(typeof env.PORT).toBe('number');
    expect(env.CORS_ORIGIN).toBeDefined();
    expect(env.OPENAI_BASE_URL).toBeDefined();
    expect(env.OPENAI_MODEL).toBeDefined();
  });
});
