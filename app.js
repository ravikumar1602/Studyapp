// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Unregister any existing service workers first
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister();
        console.log('Unregistered old service worker');
      }
      // Clear all caches
      return caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      });
    })
    .then(() => {
      // Register new service worker
      return navigator.serviceWorker.register('/sw.js', { scope: '/' });
    })
    .then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      // Check for updates
      registration.update();
    })
    .catch(err => {
      console.error('ServiceWorker registration failed: ', err);
    });
  });
}

// Handle install prompt
let deferredPrompt;
const installButton = document.getElementById('installButton');

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show install button if it exists
  if (installButton) {
    installButton.style.display = 'block';
    installButton.addEventListener('click', () => {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
      });
    });
  }
});

// Check if app is running in standalone mode
window.addEventListener('appinstalled', (evt) => {
  console.log('App was installed');
  if (installButton) {
    installButton.style.display = 'none';
  }
});

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav');

if (mobileMenuToggle && mainNav) {
  mobileMenuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('active');
    mobileMenuToggle.classList.toggle('active');
  });

  // Close mobile menu when clicking on a nav link
  const navLinks = mainNav.querySelectorAll('a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('active');
      mobileMenuToggle.classList.remove('active');
    });
  });
}

// Add active class to current page in navigation
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const navLinks = document.querySelectorAll('.main-nav a');

navLinks.forEach(link => {
  const linkPath = link.getAttribute('href');
  if (linkPath === currentPage || 
      (currentPage === '' && linkPath === 'index.html')) {
    link.classList.add('active');
  } else {
    link.classList.remove('active');
  }
});

// Check if the page is loaded in standalone mode
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('Running in standalone mode');
  if (installButton) {
    installButton.style.display = 'none';
  }
}
