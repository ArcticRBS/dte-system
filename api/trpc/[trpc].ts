import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appRouter } from "../../server/routers";
import { sdk } from "../../server/_core/sdk";
import type { User } from "../../drizzle/schema";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request to fetch Request
  const url = new URL(req.url || "", `https://${req.headers.host}`);
  
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = JSON.stringify(req.body);
  }

  const fetchRequest = new Request(url.toString(), {
    method: req.method,
    headers,
    body,
  });

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: fetchRequest,
    router: appRouter,
    createContext: async () => {
      let user: User | null = null;
      try {
        // Create a mock express request for SDK authentication
        const mockReq = {
          headers: req.headers,
          cookies: req.cookies || {},
        } as any;
        user = await sdk.authenticateRequest(mockReq);
      } catch (error) {
        user = null;
      }
      return {
        req: req as any,
        res: res as any,
        user,
      };
    },
  });

  // Set response headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  // Set status and send body
  res.status(response.status);
  const responseBody = await response.text();
  res.send(responseBody);
}
