import {
	API,
	type APIMessageTopLevelComponent,
	ComponentType,
	MessageFlags,
} from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { Webhooks } from "@octokit/webhooks";
import type { StarEvent, WebhookEvent, WebhookEventName } from "@octokit/webhooks-types";
import { starCreateComponents } from "../events/star.js";

interface Env {
	GITHUB_WEBHOOK_SERCET: string;
	DISCORD_WEBHOOK_ID: string;
	DISCORD_WEBHOOK_TOKEN: string;
}

export default {
	async fetch(request, env) {
		if (request.method !== "POST") {
			return new Response(null, { status: 405 });
		}

		const eventType = request.headers.get("x-github-event") as WebhookEventName;

		if (eventType === "ping") {
			await new API(new REST()).webhooks.execute(
				env.DISCORD_WEBHOOK_ID,
				env.DISCORD_WEBHOOK_TOKEN,
				{ allowed_mentions: { parse: [] }, content: "Ping!" },
			);

			return new Response(null, { status: 204 });
		}

		const signature = request.headers.get("x-hub-signature-256");
		const text = await request.text();
		const webhooks = new Webhooks({ secret: env.GITHUB_WEBHOOK_SERCET });

		try {
			await webhooks.verify(text, signature!);
		} catch (error) {
			console.error(error);
			return new Response(null, { status: 401 });
		}

		const payload = JSON.parse(text) as WebhookEvent;
		let components: APIMessageTopLevelComponent[] | undefined;

		if (eventType === "star") {
			components = starCreateComponents(payload as StarEvent);
		}

		if (!components) {
			components = [
				{
					type: ComponentType.Container,
					components: [
						{
							type: ComponentType.TextDisplay,
							content: `\`\`\`JSON\n${JSON.stringify({ eventType, ...payload }).slice(0, 50)}\n\`\`\``,
						},
					],
				},
			];
		}

		await new API(new REST()).webhooks.execute(env.DISCORD_WEBHOOK_ID, env.DISCORD_WEBHOOK_TOKEN, {
			allowed_mentions: { parse: [] },
			components,
			flags: MessageFlags.IsComponentsV2,
			with_components: true,
		});

		return new Response(null, { status: 204 });
	},
} satisfies ExportedHandler<Env>;
