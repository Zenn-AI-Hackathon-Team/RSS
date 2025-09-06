/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "placehold.co",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "**", // 他の外部画像ソースも許可
				port: "",
				pathname: "/**",
			},
		],
	},
};

module.exports = nextConfig;
