"use client";

import { Tweet } from "react-tweet";

export function ClientTweetCard({ id }: { id: string }) {
	return (
		<div className="flex justify-center w-full tweet-embed">
			<div className="w-full max-w-[560px]">
				<Tweet id={id} />
			</div>
		</div>
	);
}
