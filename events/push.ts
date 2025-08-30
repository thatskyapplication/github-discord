import {
	type APIMessageTopLevelComponent,
	ComponentType,
	SeparatorSpacingSize,
} from "@discordjs/core/http-only";
import type { PushEvent } from "@octokit/webhooks-types";

export function pushCreatedComponents(payload: PushEvent): APIMessageTopLevelComponent[] {
	const branch = payload.ref.replace("refs/heads/", "");

	const commits = payload.commits.map(
		(commit) =>
			`[\`${commit.id.slice(0, 7)}\`](${commit.url}) ${commit.committer.name}: ${commit.message} <t:${Date.parse(commit.timestamp) / 1000}:R>`,
	);

	const commitDescription =
		commits.length > 1
			? `[${payload.before.slice(0, 7)}...${payload.after.slice(0, 7)}](${payload.compare})\n${commits.join("\n")}`
			: commits[0]!;

	return [
		{
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: `[${payload.sender.name ?? payload.sender.login}](${payload.sender.html_url}) committed to [${payload.repository.name}:${branch}](${payload.repository.html_url}).\n${commitDescription}`,
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
