import { TEXT_DISPLAY_MAX_LENGTH } from "./constants.js";

export function truncateContent(content: string): string {
	if (content.length <= TEXT_DISPLAY_MAX_LENGTH) {
		return content;
	}

	return `${content.slice(0, TEXT_DISPLAY_MAX_LENGTH - 1)}…`;
}
