
	const CACHE_NAME = 'market-screener-v1.0.0';
	const urlsToCache = [
		'/screener',
		'https://code.highcharts.com/stock/highstock.js'
	];

	// Install service worker
	self.addEventListener('install', event => {
		event.waitUntil(
			caches.open(CACHE_NAME)
				.then(cache => {
					console.log('Market Screener PWA: Caching resources');
					return cache.addAll(urlsToCache);
				})
				.catch(err => {
					console.log('Market Screener PWA: Cache install failed', err);
				})
		);
		self.skipWaiting();
	});

	// Activate service worker
	self.addEventListener('activate', event => {
		event.waitUntil(
			caches.keys().then(cacheNames => {
				return Promise.all(
					cacheNames.map(cacheName => {
						if (cacheName !== CACHE_NAME && cacheName.startsWith('market-screener-')) {
							console.log('Market Screener PWA: Deleting old cache', cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
		);
		self.clients.claim();
	});

	// Fetch events - offline-first strategy
	self.addEventListener('fetch', event => {
		const url = new URL(event.request.url);
	
		// Handle Market Screener-specific requests
		if (url.pathname.startsWith('/screener')) {
			event.respondWith(handleScreenerRequest(event.request));
		}
	});

	async function handleScreenerRequest(request) {
		const url = new URL(request.url);
	
		// For main screener page, try cache first, then network
		if (url.pathname === '/screener') {
			try {
				const cachedResponse = await caches.match(request);
				if (cachedResponse) {
					// Try to update cache in background
					fetch(request).then(response => {
						if (response.ok) {
							caches.open(CACHE_NAME).then(cache => {
								cache.put(request, response.clone());
							});
						}
					}).catch(() => {
						// Network failed, use cached version
					});
					return cachedResponse;
				}
			
				// No cache, try network
				const networkResponse = await fetch(request);
				if (networkResponse.ok) {
					// Cache the response
					const cache = await caches.open(CACHE_NAME);
					cache.put(request, networkResponse.clone());
					return networkResponse;
				}
			
				// Network failed, return offline page
				return new Response(`
					<!DOCTYPE html>
					<html><head><title>Market Screener - Offline</title>
					<meta name='viewport' content='width=device-width, initial-scale=1'>
					<style>body{font-family: 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; padding: 2rem; text-align: center;}
					.offline{background: #1a1a1a; padding: 2rem; border-radius: 12px; margin: 2rem auto; max-width: 400px; border: 1px solid #333;}
					h1{color: #4CAF50;}</style></head>
					<body><div class='offline'><h1>Market Screener - Offline</h1><p>You're currently offline. Please check your connection and try again.</p></div></body></html>
				`, { 
					status: 200, 
					headers: { 'Content-Type': 'text/html' } 
				});
			} catch (error) {
				console.log('Market Screener PWA: Fetch error', error);
				return new Response('Network error', { status: 500 });
			}
		}
	
		// For other resources, try network first
		try {
			return await fetch(request);
		} catch (error) {
			const cachedResponse = await caches.match(request);
			if (cachedResponse) {
				return cachedResponse;
			}
			throw error;
		}
	}
			