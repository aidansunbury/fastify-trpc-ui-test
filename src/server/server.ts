import ws from "@fastify/websocket";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import fastify from "fastify";
import { appRouter } from "./router";
import { createContext } from "./router/context";
import { renderTrpcPanel } from "trpc-ui";

export interface ServerOptions {
	dev?: boolean;
	port?: number;
	prefix?: string;
}

export function createServer(opts: ServerOptions) {
	const dev = opts.dev ?? true;
	const port = opts.port ?? 3000;
	const prefix = opts.prefix ?? "/trpc";
	const server = fastify({ logger: dev });

	void server.register(ws);
	void server.register(fastifyTRPCPlugin, {
		prefix,
		useWSS: true,
		trpcOptions: { router: appRouter, createContext },
	});

	server.get("/", async () => {
		return { hello: "wait-on 💨" };
	});

	server.get("/panel", async (_, reply) => {
		const html = renderTrpcPanel(appRouter, {
			url: "http://localhost:2022/trpc",
			transformer: "superjson",
		});
		reply.type("text/html").send(html);
	});

	const stop = async () => {
		await server.close();
	};
	const start = async () => {
		try {
			await server.listen({ port });
			console.log("listening on port", port);
		} catch (err) {
			server.log.error(err);
			process.exit(1);
		}
	};

	return { server, start, stop };
}
