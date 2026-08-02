import {
	type APIMessageTopLevelComponent,
	ComponentType,
	SeparatorSpacingSize,
} from "@discordjs/core/http-only";
import type { PushEvent } from "@octokit/webhooks-types";

const COMMIT_DESCRIPTION_TARGET_LENGTH = 1_000 as const;
const REVISION_SHA_PATTERN = /^[\da-f]{8,40}/i;

function abbreviateRevision(revision: string): string {
	const sha = REVISION_SHA_PATTERN.exec(revision)?.[0];

	if (sha === undefined) {
		return revision;
	}

	return `${sha.slice(0, 7)}${revision.slice(sha.length)}`;
}

function createdComparisonLabel(compare: string): string {
	try {
		const marker = "/compare/";
		const pathname = new URL(compare).pathname;
		const markerIndex = pathname.indexOf(marker);

		if (markerIndex === -1) {
			return "Compare pushed commits";
		}

		const range = decodeURIComponent(pathname.slice(markerIndex + marker.length));
		const revisions = range.split("...");

		if (revisions.length !== 2 || revisions[0] === "" || revisions[1] === "") {
			return "Compare pushed commits";
		}

		return revisions.map(abbreviateRevision).join("...");
	} catch {
		return "Compare pushed commits";
	}
}

export function pushCreatedComponents(payload: PushEvent): APIMessageTopLevelComponent[] {
	const ref = payload.ref.replace(/^refs\/(?:heads|tags)\//, "");
	let message = `[${payload.sender.name ?? payload.sender.login}](${payload.sender.html_url})`;

	if (payload.forced) {
		message += ` force-pushed [${payload.repository.name}:${ref}](${payload.repository.html_url}) to \`${payload.after.slice(0, 7)}\`.`;
	} else {
		const commitLines: string[] = [];
		let commitDescriptionLength = 0;

		for (const { id, url, author, message, timestamp } of payload.commits) {
			if (commitDescriptionLength >= COMMIT_DESCRIPTION_TARGET_LENGTH) {
				break;
			}

			const title = message.split("\n", 1)[0] ?? "";
			const line = `[\`${id.slice(0, 7)}\`](${url}) ${author.username ?? author.name}: ${title} <t:${Math.floor(Date.parse(timestamp) / 1_000)}:R>`;
			commitLines.push(line);
			commitDescriptionLength += line.length + 1;
		}

		let commits = commitLines.join("\n");

		if (commitLines.length < payload.commits.length) {
			commits += "\n...and more.";
		}

		const comparisonLabel = payload.created
			? createdComparisonLabel(payload.compare)
			: `${payload.before.slice(0, 7)}...${payload.after.slice(0, 7)}`;
		const commitDescription =
			payload.commits.length > 1 ? `[${comparisonLabel}](${payload.compare})\n${commits}` : commits;

		message += ` pushed to [${payload.repository.name}:${ref}](${payload.repository.html_url}).\n${commitDescription}`;
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
