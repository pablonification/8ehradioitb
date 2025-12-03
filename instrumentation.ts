// Polyfill for Node.js 22+ localStorage issue with Next.js dev server
// Node.js 22+ has built-in localStorage but it requires --localstorage-file flag
// This causes issues with Next.js DevOverlay during SSR

export async function register() {
  if (typeof globalThis.localStorage !== "undefined") {
    // Create a mock localStorage that works during SSR
    const storage = new Map<string, string>();

    const mockLocalStorage = {
      getItem(key: string): string | null {
        return storage.get(key) ?? null;
      },
      setItem(key: string, value: string): void {
        storage.set(key, String(value));
      },
      removeItem(key: string): void {
        storage.delete(key);
      },
      clear(): void {
        storage.clear();
      },
      get length(): number {
        return storage.size;
      },
      key(index: number): string | null {
        const keys = Array.from(storage.keys());
        return keys[index] ?? null;
      },
    };

    // Only override if localStorage.getItem is not a function (Node.js built-in without file)
    if (typeof globalThis.localStorage.getItem !== "function") {
      Object.defineProperty(globalThis, "localStorage", {
        value: mockLocalStorage,
        writable: true,
        configurable: true,
      });
    }
  }
}
