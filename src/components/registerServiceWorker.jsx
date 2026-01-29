export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registriert:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker Registrierung fehlgeschlagen:', error);
        });
    });
  }
};