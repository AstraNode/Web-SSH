/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: [
        "@xterm/xterm",
        "@xterm/addon-fit",
        "@xterm/addon-webgl",
    ],
};

export default nextConfig;