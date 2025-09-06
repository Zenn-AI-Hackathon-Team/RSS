"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";

function proxyLoader({ src, width, quality }: ImageLoaderProps) {
	const q = quality || 75;
	return `/api/img?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}

export default function SmartImage(props: ImageProps) {
	return <Image {...props} loader={proxyLoader} unoptimized />;
}
