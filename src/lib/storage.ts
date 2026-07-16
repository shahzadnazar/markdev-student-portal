const TOKEN_KEY = "markdev.token";
const REMEMBER_KEY = "markdev.remember";

/**
 * Sanctum bearer-token storage.
 *
 * "Remember me" decides the backing store: localStorage survives the browser
 * session, sessionStorage does not. The remember flag itself always lives in
 * localStorage so we know where to look on boot.
 */
export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  },

  set(token: string, remember: boolean) {
    this.clear();
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  },
};
