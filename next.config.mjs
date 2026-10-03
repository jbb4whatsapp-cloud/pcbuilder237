/** @type {import('next').NextConfig} */
const nextConfig = {
  // À retirer en P0-6 (« retirer ignoreBuildErrors ») une fois les anciennes pages réécrites.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
