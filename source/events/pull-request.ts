import {
	type APIContainerComponent,
	type APIMessageTopLevelComponent,
	ComponentType,
	SeparatorSpacingSize,
} from "@discordjs/core/http-only";
import type { PullRequestClosedEvent, PullRequestOpenedEvent } from "@octokit/webhooks-types";
import { truncateContent } from "../utility/functions.js";

export function pullRequestComponents(
	payload: PullRequestClosedEvent | PullRequestOpenedEvent,
): APIMessageTopLevelComponent[] {
	const merged = payload.action === "closed" && payload.pull_request.merged;
	const action = merged ? "merged" : payload.action;
	const container: APIContainerComponent = {
		type: ComponentType.Container,
		components: [
			{
				type: ComponentType.TextDisplay,
				content: `[${payload.sender.name ?? payload.sender.login}](${payload.sender.html_url}) ${action} pull request [#${payload.number}: ${payload.pull_request.title}](${payload.pull_request.html_url})`,
			},
		],
	};

	if (payload.action === "opened") {
		const { body } = payload.pull_request;

		if (body !== null && body.trim().length > 0) {
			container.components.push({
				type: ComponentType.TextDisplay,
				content: truncateContent(body),
			});
		}
	}

	container.components.push(
		{
			type: ComponentType.Separator,
			divider: true,
			spacing: SeparatorSpacingSize.Small,
		},
		{
			type: ComponentType.TextDisplay,
			content: `-# [${payload.repository.full_name}](${payload.repository.html_url})`,
		},
	);

	if (merged) {
		container.accent_color = 0x8250df;
	}

	return [container];
}
