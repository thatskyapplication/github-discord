import {
	type APIMessageTopLevelComponent,
	ComponentType,
	SeparatorSpacingSize,
} from "@discordjs/core/http-only";
import type { DeleteEvent } from "@octokit/webhooks-types";

export function deleteComponents(payload: DeleteEvent): APIMessageTopLevelComponent[] {
	return [
		{
			type: ComponentType.Container,
			components: [
				{
					type: ComponentType.TextDisplay,
					content: `[${payload.sender.name ?? payload.sender.login}](${payload.sender.html_url}) deleted a ${payload.ref_type}: ${payload.ref}`,
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
