// PWA Install Prompt
let deferredPrompt;
const installButton = document.getElementById('installButton');

// Only show install button if PWA is not already installed
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    if (installButton) installButton.style.display = 'none';
}

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show the install button if it exists
    if (installButton) {
        installButton.style.display = 'block';
        
        // Add click event to the install button
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
                // Clear the deferredPrompt variable
                deferredPrompt = null;
            });
        });
    }
});

// Track if the app is launched as a PWA
window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed as PWA');
    if (installButton) installButton.style.display = 'none';
});

// Check if the app is running in standalone mode
function isRunningStandalone() {
    return (window.matchMedia('(display-mode: standalone)').matches) || 
           (window.navigator.standalone) || 
           document.referrer.includes('android-app://');
}

// Add a class to the body if running as PWA
if (isRunningStandalone()) {
    document.body.classList.add('pwa-launched');
}
