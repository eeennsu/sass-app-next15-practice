import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    /* config options here */
    reactStrictMode: false,
    experimental: {
        staleTimes: {
            dynamic: 0, // dynamic 데이터를 캐시하지 않고 항상 최신 데이터를 가져옴
        },
    },
}

export default nextConfig
