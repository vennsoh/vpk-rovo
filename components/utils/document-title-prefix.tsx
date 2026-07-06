"use client";

import { useEffect } from "react";
import { formatDocumentTitleWithPrefix, getDocumentTitlePrefix } from "@/lib/document-title-prefix";

export function DocumentTitlePrefix() {
	useEffect(() => {
		const titlePrefix = getDocumentTitlePrefix(window.location);

		if (!titlePrefix) {
			return;
		}

		const applyTitlePrefix = () => {
			const nextTitle = formatDocumentTitleWithPrefix(document.title, titlePrefix);

			if (document.title !== nextTitle) {
				document.title = nextTitle;
			}
		};

		applyTitlePrefix();

		if (typeof MutationObserver === "undefined" || !document.head) {
			return;
		}

		const observer = new MutationObserver(() => {
			applyTitlePrefix();
		});

		observer.observe(document.head, {
			childList: true,
			characterData: true,
			subtree: true,
		});

		return () => {
			observer.disconnect();
		};
	}, []);

	return null;
}
