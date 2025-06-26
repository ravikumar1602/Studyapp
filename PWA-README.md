# StudyApp - Progressive Web App

StudyApp is now a Progressive Web App (PWA) with offline capabilities and installability.

## Features

- **Offline Support**: Access previously visited pages without an internet connection
- **Installable**: Add to home screen on mobile devices and install as a desktop app
- **Fast Loading**: Caches assets for faster loading on subsequent visits
- **Reliable**: Automatically updates in the background

## Testing PWA Features

### Install the PWA

1. Open the app in Chrome, Edge, or any Chromium-based browser
2. Look for the install icon in the address bar or the browser menu
3. Click "Install" to add the app to your home screen or desktop

### Testing Offline Mode

1. Open the app in Chrome
2. Open DevTools (F12)
3. Go to the "Application" tab
4. Check "Offline" in the Service Workers section
5. Refresh the page - you should still see the app working

### Clearing Cache

To clear the PWA cache:

1. Open DevTools (F12)
2. Go to the "Application" tab
3. Click "Clear storage" in the left sidebar
4. Check "Unregister service workers" and "Cache storage"
5. Click "Clear site data"

## Development

### Updating the Service Worker

1. Increment the `CACHE_NAME` version in `sw.js` when making changes
2. The new service worker will be installed in the background
3. All tabs must be closed and reopened for the update to take effect

### Testing Updates

1. Make your changes to the service worker
2. Increment the version number
3. Open the app in a new tab
4. Check the "Application" tab in DevTools to see the new service worker installing
5. Click "skipWaiting" to immediately activate the new service worker

## Browser Support

- Chrome 40+ (full support)
- Firefox 44+
- Edge 17+
- Safari 11.1+ (iOS 11.3+)
- Opera 27+
- Samsung Internet 4+
