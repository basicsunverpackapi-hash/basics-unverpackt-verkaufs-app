let registered = false;

export const registerServiceWorker = () => {
  if (registered || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  registered = true;

  const baseUrl = import.meta.env.BASE_URL || './';
  const swUrl = `${baseUrl}sw.js`;

  const register = () => {
    navigator.serviceWorker
      .register(swUrl, { scope: baseUrl })
      .then((registration) => {
        registration.update().catch(() => {});
      })
      .catch((error) => {
        console.error('Service Worker konnte nicht registriert werden:', error);
      });
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }

  if (navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }
};
