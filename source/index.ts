import { API, type APIMessageTopLevelComponent, MessageFlags } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { Webhooks } from "@octokit/webhooks";
import type {
	CreateEvent,
	DeleteEvent,
	PushEvent,
	StarEvent,
	WebhookEvent,
	WebhookEventName,
} from "@octokit/webhooks-types";
import { withSentry } from "@sentry/cloudflare";
import { createComponents } from "./events/create.js";
import { deleteComponents } from "./events/delete.js";
import { pushCreatedComponents } from "./events/push.js";
import { starCreatedComponents } from "./events/star.js";

interface Env {
	GITHUB_WEBHOOK_SECRET: string;
	DISCORD_WEBHOOK_ID: string;
	DISCORD_WEBHOOK_TOKEN: string;
	SENTRY_DATA_SOURCE_NAME: string;
}

export default withSentry((env) => ({ dsn: env.SENTRY_DATA_SOURCE_NAME, sendDefaultPii: true }), {
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
		const webhooks = new Webhooks({ secret: env.GITHUB_WEBHOOK_SECRET });

		try {
			await webhooks.verify(text, signature!);
		} catch (error) {
			console.error(error);
			return new Response(null, { status: 401 });
		}

		const payload = JSON.parse(text) as WebhookEvent;

		if ("repository" in payload && payload.repository.private) {
			return new Response(null, { status: 204 });
		}

		let components: APIMessageTopLevelComponent[] | undefined;

		if (eventType === "create") {
			components = createComponents(payload as CreateEvent);
		} else if (eventType === "push") {
			const pushEvent = payload as PushEvent;

			// Deleting a branch or tag triggers a push event with no commits.
			// Allow force-pushes.
			if (pushEvent.commits.length === 0 && !pushEvent.forced) {
				return new Response(null, { status: 204 });
			}

			components = pushCreatedComponents(pushEvent);
		} else if (eventType === "delete") {
			components = deleteComponents(payload as DeleteEvent);
		} else if (eventType === "star") {
			const starEvent = payload as StarEvent;

			if (starEvent.action === "deleted") {
				return new Response(null, { status: 204 });
			}

			components = starCreatedComponents(starEvent);
		} else {
			throw new Error(`Unhandled event type: ${eventType}.`);
		}

		await new API(new REST()).webhooks.execute(env.DISCORD_WEBHOOK_ID, env.DISCORD_WEBHOOK_TOKEN, {
			allowed_mentions: { parse: [] },
			components,
			flags: MessageFlags.IsComponentsV2,
			with_components: true,
		});

		return new Response(null, { status: 204 });
	},
} satisfies ExportedHandler<Env>);
