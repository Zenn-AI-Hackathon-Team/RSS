"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";

// Passthrough loader: return the original URL so we don't hit Next's optimizer
function passthroughLoader({ src }: ImageLoaderProps) {
	return src;
}

export default function SmartImage(props: ImageProps) {
	return <Image {...props} loader={passthroughLoader} unoptimized />;
}
