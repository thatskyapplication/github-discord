import { API, type APIMessageTopLevelComponent, MessageFlags } from "@discordjs/core/http-only";
import { REST } from "@discordjs/rest";
import { Webhooks } from "@octokit/webhooks";
import type {
	CreateEvent,
	DeleteEvent,
	PullRequestEvent,
	PushEvent,
	StarEvent,
	WebhookEvent,
	WebhookEventName,
} from "@octokit/webhooks-types";
import { withSentry } from "@sentry/cloudflare";
import { createComponents } from "./events/create.js";
import { deleteComponents } from "./events/delete.js";
import { pullRequestClosedComponents } from "./events/pull-request.js";
import { pushCreatedComponents } from "./events/push.js";
import { starCreatedComponents } from "./events/star.js";

interface Env {
	GITHUB_WEBHOOK_SECRET: string;
	DISCORD_WEBHOOK_ID: string;
	DISCORD_WEBHOOK_TOKEN: string;
	SENTRY_DATA_SOURCE_NAME: string;
	CF_VERSION_METADATA: WorkerVersionMetadata;
}

export default withSentry(
	(env) => ({
		dsn: env.SENTRY_DATA_SOURCE_NAME,
		release: env.CF_VERSION_METADATA.id,
		sendDefaultPii: true,
	}),
	{
		async fetch(request, env) {
			if (request.method !== "POST") {
				return new Response(null, { status: 405 });
			}

			const eventType = request.headers.get("x-github-event") as WebhookEventName;
			const signature = request.headers.get("x-hub-signature-256");
			const text = await request.text();
			const webhooks = new Webhooks({ secret: env.GITHUB_WEBHOOK_SECRET });

			if (!signature) {
				return new Response(null, { status: 401 });
			}

			try {
				if (!(await webhooks.verify(text, signature))) {
					return new Response(null, { status: 401 });
				}
			} catch (error) {
				console.error(error);
				return new Response(null, { status: 401 });
			}

			if (eventType === "ping") {
				await new API(new REST()).webhooks.execute(
					env.DISCORD_WEBHOOK_ID,
					env.DISCORD_WEBHOOK_TOKEN,
					{ allowed_mentions: { parse: [] }, content: "Ping!" },
					{ signal: AbortSignal.timeout(9_000) },
				);

				return new Response(null, { status: 204 });
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

				// Delete events have their own notification. A new ref with no unique
				// commits is already announced by its create event.
				if (pushEvent.deleted || (pushEvent.created && pushEvent.commits.length === 0)) {
					return new Response(null, { status: 204 });
				}

				components = pushCreatedComponents(pushEvent);
			} else if (eventType === "delete") {
				components = deleteComponents(payload as DeleteEvent);
			} else if (eventType === "pull_request") {
				const pullRequestEvent = payload as PullRequestEvent;

				if (pullRequestEvent.action !== "closed") {
					return new Response(null, { status: 204 });
				}

				components = pullRequestClosedComponents(pullRequestEvent);
			} else if (eventType === "star") {
				const starEvent = payload as StarEvent;

				if (starEvent.action === "deleted") {
					return new Response(null, { status: 204 });
				}

				components = starCreatedComponents(starEvent);
			} else {
				throw new Error(`Unhandled event type: ${eventType}.`);
			}

			await new API(new REST()).webhooks.execute(
				env.DISCORD_WEBHOOK_ID,
				env.DISCORD_WEBHOOK_TOKEN,
				{
					allowed_mentions: { parse: [] },
					components,
					flags: MessageFlags.IsComponentsV2,
					with_components: true,
				},
				{ signal: AbortSignal.timeout(9_000) },
			);

			return new Response(null, { status: 204 });
		},
	} satisfies ExportedHandler<Env>,
);
