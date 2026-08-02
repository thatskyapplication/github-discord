import {
	type APIMessageTopLevelComponent,
	ComponentType,
	SeparatorSpacingSize,
} from "@discordjs/core/http-only";
import type { PullRequestClosedEvent } from "@octokit/webhooks-types";

export function pullRequestClosedComponents(
	payload: PullRequestClosedEvent,
): APIMessageTopLevelComponent[] {
	const action = payload.pull_request.merged ? "merged" : "closed";

	return [
		{
			type: ComponentType.Container,
			accent_color: payload.pull_request.merged ? 0x8250df : 0xfc2a29,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: `[${payload.sender.name ?? payload.sender.login}](${payload.sender.html_url}) ${action} pull request [#${payload.number}: ${payload.pull_request.title}](${payload.pull_request.html_url})`,
				},
				{
					type: ComponentType.Separator,
					divider: true,
					spacing: SeparatorSpacingSize.Small,
				},
				{
					type: ComponentType.TextDisplay,
					content: `-# [${payload.repository.full_name}](${payload.repository.html_url})`,
				},
			],
		},
	];
}
