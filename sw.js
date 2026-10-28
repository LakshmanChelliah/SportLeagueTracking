const CACHE = "gdra-v4"
const SHELL = ["./offline.html", "./", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        Promise.all(
          SHELL.map((path) =>
            cache.add(new URL(path, self.registration.scope)).catch(() => undefined),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.includes("/api/")) return
  if (request.headers.get("rsc") || request.headers.get("next-router-prefetch") || request.headers.get("next-router-segment-prefetch") || request.headers.get("next-router-state-tree")) return
  const accept = request.headers.get("accept") || ""
  if (accept.includes("text/x-component")) return

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request))
    return
  }

  if (url.pathname.includes("/_next/static/") || url.pathname.includes("/icons/")) {
    event.respondWith(cacheFirst(request))
  }
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) {
      try {
        await cache.put(request, response.clone())
      } catch {
        // Some responses cannot be stored. The network result still stands.
      }
    }
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    const offline = await cache.match(new URL("./offline.html", self.registration.scope))
    return offline || Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    try {
      await cache.put(request, response.clone())
    } catch {
      // Ignore cache write failures.
    }
  }
  return response
}
