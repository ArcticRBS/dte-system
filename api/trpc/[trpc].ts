import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { appRouter } from "../../server/routers";
import { sdk } from "../../server/_core/sdk";
import type { User } from "../../drizzle/schema";
import { serialize } from "cookie";

export const config = {
  runtime: "nodejs",
};

// Helper to create a mock response object that captures cookie calls
function createMockResponse(realRes: VercelResponse) {
  const cookies: string[] = [];
  
  return {
    cookies,
    cookie: (name: string, value: string, options: any = {}) => {
      const cookieString = serialize(name, value, {
        path: options.path || "/",
        httpOnly: options.httpOnly !== false,
        secure: options.secure !== false,
        sameSite: options.sameSite || "lax",
        maxAge: options.maxAge,
        domain: options.domain,
      });
      cookies.push(cookieString);
    },
    clearCookie: (name: string, options: any = {}) => {
      const cookieString = serialize(name, "", {
        path: options.path || "/",
        httpOnly: options.httpOnly !== false,
        secure: options.secure !== false,
        sameSite: options.sameSite || "lax",
        maxAge: -1,
        expires: new Date(0),
      });
      cookies.push(cookieString);
    },
    // Proxy other methods to real response
    setHeader: realRes.setHeader.bind(realRes),
    status: realRes.status.bind(realRes),
    send: realRes.send.bind(realRes),
    json: realRes.json.bind(realRes),
  };
}

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

  // Create mock response to capture cookies
  const mockRes = createMockResponse(res);

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
        res: mockRes as any,
        user,
      };
    },
  });

  // Set response headers from tRPC response
  response.headers.forEach((value, key) => {
    // Skip content-length as it may change
    if (key.toLowerCase() !== "content-length") {
      res.setHeader(key, value);
    }
  });

  // Set cookies that were captured during the request
  if (mockRes.cookies.length > 0) {
    res.setHeader("Set-Cookie", mockRes.cookies);
  }

  // Set status and send body
  res.status(response.status);
  const responseBody = await response.text();
  res.send(responseBody);
}
