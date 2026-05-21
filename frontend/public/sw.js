if (!self.define) {
  let e,
    s = {};
  const n = (n, t) => (
    (n = new URL(n + ".js", t).href),
    s[n] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = n), (e.onload = s), document.head.appendChild(e));
        } else ((e = n), importScripts(n), s());
      }).then(() => {
        let e = s[n];
        if (!e) throw new Error(`Module ${n} didn’t register its module`);
        return e;
      })
  );
  self.define = (t, c) => {
    const a =
      e ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (s[a]) return;
    let i = {};
    const o = (e) => n(e, a),
      r = { module: { uri: a }, exports: i, require: o };
    s[a] = Promise.all(t.map((e) => r[e] || o(e))).then((e) => (c(...e), i));
  };
}
define(["./workbox-4754cb34"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: "/_next/static/GBL2N-8XDHIpY0-W2bd9B/_buildManifest.js",
          revision: "a5be963d69e3fc3b489e30594399c6bb",
        },
        {
          url: "/_next/static/GBL2N-8XDHIpY0-W2bd9B/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/chunks/4bd1b696-215e5051988c3dde.js",
          revision: "215e5051988c3dde",
        },
        {
          url: "/_next/static/chunks/794-5fb6eff04a716ab6.js",
          revision: "5fb6eff04a716ab6",
        },
        {
          url: "/_next/static/chunks/app/_global-error/page-c0e54ebba1c0ecfe.js",
          revision: "c0e54ebba1c0ecfe",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-60c4d3cb88e52ce5.js",
          revision: "60c4d3cb88e52ce5",
        },
        {
          url: "/_next/static/chunks/app/layout-aa24d2d5f3438acc.js",
          revision: "aa24d2d5f3438acc",
        },
        {
          url: "/_next/static/chunks/app/page-c0e54ebba1c0ecfe.js",
          revision: "c0e54ebba1c0ecfe",
        },
        {
          url: "/_next/static/chunks/framework-5ce682ea41927f33.js",
          revision: "5ce682ea41927f33",
        },
        {
          url: "/_next/static/chunks/main-app-aba68a1ab57306d0.js",
          revision: "aba68a1ab57306d0",
        },
        {
          url: "/_next/static/chunks/main-d9434cb7e327c5cc.js",
          revision: "d9434cb7e327c5cc",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/app-error-c0e54ebba1c0ecfe.js",
          revision: "c0e54ebba1c0ecfe",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/forbidden-c0e54ebba1c0ecfe.js",
          revision: "c0e54ebba1c0ecfe",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/global-error-8444ab5dc16bd8ef.js",
          revision: "8444ab5dc16bd8ef",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/not-found-c0e54ebba1c0ecfe.js",
          revision: "c0e54ebba1c0ecfe",
        },
        {
          url: "/_next/static/chunks/next/dist/client/components/builtin/unauthorized-c0e54ebba1c0ecfe.js",
          revision: "c0e54ebba1c0ecfe",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-52d428ccd66bfe75.js",
          revision: "52d428ccd66bfe75",
        },
        {
          url: "/_next/static/css/d6b5efc4dd7205e9.css",
          revision: "d6b5efc4dd7205e9",
        },
        {
          url: "/assets/logo.png",
          revision: "eb1d6efb673e4da93935b5f886a61fb4",
        },
        { url: "/manifest.json", revision: "f91d7b39de1d7f8680e2f86fad8e8521" },
      ],
      { ignoreURLParametersMatching: [] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: n,
              state: t,
            }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: "OK",
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:mp4)$/i,
      new e.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        const s = e.pathname;
        return !s.startsWith("/api/auth/") && !!s.startsWith("/api/");
      },
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        return !e.pathname.startsWith("/api/");
      },
      new e.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET",
    ),
    e.registerRoute(
      ({ url: e }) => !(self.origin === e.origin),
      new e.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET",
    ));
});
