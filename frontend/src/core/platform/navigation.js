/**
 * Navigation utility for Zashly.
 *
 * Problem: In Capacitor, using window.location.href = '/path' causes a full
 * WebView reload — destroying all state, socket connections, etc.
 *
 * Solution: We maintain a reference to the React Router navigate function
 * and use it everywhere — including in socket event handlers and async callbacks
 * that don't have direct access to the React component tree.
 */

let _navigate = null;

/**
 * Call this once from a React component that has access to useNavigate().
 * Typically registered in App.jsx.
 */
export function registerNavigate(navigateFn) {
  _navigate = navigateFn;
}

/**
 * Navigate to a route programmatically.
 * Works in any context — socket callbacks, notification handlers, etc.
 *
 * @param {string} path - The path to navigate to (e.g., '/chat/abc123')
 * @param {object} options - React Router navigate options (replace, state, etc.)
 */
export function navigateTo(path, options = {}) {
  if (_navigate) {
    _navigate(path, options);
  } else {
    // Fallback — only in web browser where reload is acceptable
    console.warn('[navigation] Router not registered, falling back to location assign');
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  }
}

/**
 * Navigate back (equivalent to browser back button).
 */
export function navigateBack() {
  if (_navigate) {
    _navigate(-1);
  }
}
