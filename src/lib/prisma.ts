// Mocked Prisma client for offline Zenit usage
// Removed @prisma/client dependency to allow building completely offline

export const prisma = new Proxy({} as any, {
  get: () => {
    return new Proxy({} as any, {
      get: () => {
        // Return a mock function that returns an empty array / object, etc.
        return async () => {
          console.warn('Called mocked prisma instance offline');
          return null;
        }
      }
    });
  }
});

export default prisma;