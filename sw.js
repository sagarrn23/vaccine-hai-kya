self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click received.');

    event.notification.close();

    event.waitUntil(
        clients.openWindow('https://selfregistration.cowin.gov.in/')
            .then(() => {
                self.registration.unregister()
                    .then(function() {
                        console.log('unregistered');
                    })
            })
    );

});