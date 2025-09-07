/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "placehold.co", pathname: "/**" },
			// Twitter/X images
			{ protocol: "https", hostname: "pbs.twimg.com", pathname: "/**" },
			{ protocol: "https", hostname: "abs.twimg.com", pathname: "/**" },
			{ protocol: "https", hostname: "ton.twimg.com", pathname: "/**" },
			// Instagram CDN (region-specific subdomains)
			{ protocol: "https", hostname: "scontent.cdninstagram.com", pathname: "/**" },
			{ protocol: "https", hostname: "*.cdninstagram.com", pathname: "/**" },
		],
	},
};

module.exports = nextConfig;
