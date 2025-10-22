const baseUrl = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

let isLoggingOut = false;

export const logoutAndRedirect = async (target: string = '/login') => {
  if (typeof window === 'undefined' || isLoggingOut) return;
  isLoggingOut = true;
  try {
    await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // ignore
  } finally {
    window.location.replace(target);
    isLoggingOut = false;
  }
};

export const redirectAfterLogin = (role?: 'ADMIN' | 'JUDGE' | 'USER') => {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'JUDGE':
      return '/judge';
    default:
      return '/ideas/mine';
  }
};
