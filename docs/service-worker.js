
				self.addEventListener('push', event => {
					const data = event.data ? event.data.json() : {};
					const title = data.title || 'Ny notis';
					const options = {
						body: data.body || 'Du har en ny notis!',
						icon: data.icon || '/icon.png',
						data: data.url || '/'
					};
					event.waitUntil(
						self.registration.showNotification(title, options)
					);
				});

				self.addEventListener('notificationclick', event => {
					event.notification.close();
					event.waitUntil(clients.openWindow(event.notification.data));
				});
			