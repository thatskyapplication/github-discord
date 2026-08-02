import {
	type APIMessageTopLevelComponent,
	ComponentType,
	SeparatorSpacingSize,
} from "@discordjs/core/http-only";
import type { IssuesClosedEvent } from "@octokit/webhooks-types";

export function issueClosedComponents(payload: IssuesClosedEvent): APIMessageTopLevelComponent[] {
	return [
		{
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: `[${payload.sender.name ?? payload.sender.login}](${payload.sender.html_url}) closed issue [#${payload.issue.number}: ${payload.issue.title}](${payload.issue.html_url})`,
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
