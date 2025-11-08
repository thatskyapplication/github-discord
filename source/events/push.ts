import {
	type APIMessageTopLevelComponent,
	ComponentType,
	SeparatorSpacingSize,
} from "@discordjs/core/http-only";
import type { PushEvent } from "@octokit/webhooks-types";

export function pushCreatedComponents(payload: PushEvent): APIMessageTopLevelComponent[] {
	const ref = payload.ref.replace("refs/heads/", "").replace("refs/tags/", "");
	let message = `[${payload.sender.name ?? payload.sender.login}](${payload.sender.html_url})`;

	if (payload.forced) {
		message += ` force-pushed [${payload.repository.name}:${ref}](${payload.repository.html_url}) to \`${payload.after.slice(0, 7)}\`.`;
	} else {
		const commits = payload.commits.map(
			({ id, url, committer, message, timestamp }) =>
				`[\`${id.slice(0, 7)}\`](${url}) ${committer.name}: ${message.includes("\n") ? message.slice(0, message.indexOf("\n")) : message} <t:${Date.parse(timestamp) / 1000}:R>`,
		);

		const commitDescription =
			commits.length > 1
				? `[${payload.before.slice(0, 7)}...${payload.after.slice(0, 7)}](${payload.compare})\n${commits.join("\n")}`
				: commits[0]!;

		message += ` committed to [${payload.repository.name}:${ref}](${payload.repository.html_url}).\n${commitDescription}`;
	}

	return [
		{
			type: ComponentType.Container,
			accent_color: payload.forced ? 0xfc2a29 : 0x5865f2,
			components: [
				{ type: ComponentType.TextDisplay, content: message },
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
