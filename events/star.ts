import {
	type APIComponentInContainer,
	ComponentType,
	SeparatorSpacingSize,
} from "@discordjs/core/http-only";
import type { StarEvent } from "@octokit/webhooks-types";

export function starCreateComponents(payload: StarEvent): APIComponentInContainer[] {
	return [
		{
			type: ComponentType.Section,
			accessory: {
				type: ComponentType.Thumbnail,
				media: { url: payload.sender.avatar_url },
			},
			components: [
				{
					type: ComponentType.TextDisplay,
					content: `[${payload.sender.name ?? payload.sender.login}](${payload.sender.html_url}) starred [${payload.repository.name}](${payload.repository.html_url})\nStargazers: ${payload.repository.stargazers_count}`,
				},
			],
		},
		{
			type: ComponentType.Separator,
			divider: true,
			spacing: SeparatorSpacingSize.Small,
		},
		{
			type: ComponentType.TextDisplay,
			content: `[${payload.repository.full_name}](${payload.repository.html_url})`,
		},
	];
}
