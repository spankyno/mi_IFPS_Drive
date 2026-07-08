import type { NextConfig } from "next";

/**
 * Configuración de Next.js 15.
 *
 * remotePatterns: permitimos los gateways públicos de IPFS que usaremos
 * para previsualizar imágenes (CID -> URL http). Si cambias de pinning
 * service, añade aquí su gateway dedicado (más rápido y sin rate limit
 * compartido). Ver README.md -> sección "Pinning services".
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ipfs.io", pathname: "/ipfs/**" },
      { protocol: "https", hostname: "ipfs.filebase.io", pathname: "/ipfs/**" }, // gateway público de Filebase, peereado directo con sus nodos
      { protocol: "https", hostname: "*.ipfs.w3s.link", pathname: "/**" }, // web3.storage / Filebase gateway
      { protocol: "https", hostname: "gateway.pinata.cloud", pathname: "/ipfs/**" },
      { protocol: "https", hostname: "*.4everland.io", pathname: "/**" },
      { protocol: "https", hostname: "gateway.lighthouse.storage", pathname: "/ipfs/**" },
      { protocol: "https", hostname: "cloudflare-ipfs.com", pathname: "/ipfs/**" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb", // los archivos NO pasan por el server action, solo metadatos
    },
  },
  async headers() {
    return [
      {
        // Aplica a todas las rutas. CSP deliberadamente permisivo en
        // img-src/connect-src/frame-src porque no controlamos de antemano
        // qué gateway IPFS o endpoint de pinning usará quien despliegue
        // esto (depende de IPFS_PINNING_PROVIDER) — restringirlo a una
        // lista fija rompería la app al cambiar de proveedor. Lo que SÍ
        // bloqueamos sin excepción: <object>/<embed>, y que cualquier
        // otro sitio nos incruste en un iframe (clickjacking).
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js necesita 'unsafe-inline'/'unsafe-eval' en dev y para hydration scripts
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https: data: blob:",
              "media-src 'self' https:",
              "frame-src 'self' https:",
              "connect-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
