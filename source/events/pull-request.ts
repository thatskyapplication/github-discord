import {
	type APIContainerComponent,
	type APIMessageTopLevelComponent,
	ComponentType,
	SeparatorSpacingSize,
} from "@discordjs/core/http-only";
import type { PullRequestClosedEvent } from "@octokit/webhooks-types";

export function pullRequestClosedComponents(
	payload: PullRequestClosedEvent,
): APIMessageTopLevelComponent[] {
	const action = payload.pull_request.merged ? "merged" : "closed";
	const container: APIContainerComponent = {
		type: ComponentType.Container,
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
	};

	if (payload.pull_request.merged) {
		container.accent_color = 0x8250df;
	}

	return [container];
}
