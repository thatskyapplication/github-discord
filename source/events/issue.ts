import {
	type APIContainerComponent,
	type APIMessageTopLevelComponent,
	ComponentType,
	SeparatorSpacingSize,
} from "@discordjs/core/http-only";
import type { IssuesClosedEvent, IssuesOpenedEvent } from "@octokit/webhooks-types";
import { truncateContent } from "../utility/functions.js";

export function issueComponents(
	payload: IssuesClosedEvent | IssuesOpenedEvent,
): APIMessageTopLevelComponent[] {
	const container: APIContainerComponent = {
		type: ComponentType.Container,
		components: [
			{
				type: ComponentType.TextDisplay,
				content: `[${payload.sender.name ?? payload.sender.login}](${payload.sender.html_url}) ${payload.action} issue [#${payload.issue.number}: ${payload.issue.title}](${payload.issue.html_url})`,
			},
		],
	};

	if (payload.action === "opened") {
		container.accent_color = 0xd97706;
		const { body } = payload.issue;

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

	return [container];
}
