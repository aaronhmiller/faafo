import type { IncomingMessage, ServerResponse } from "node:http";
import type { DatabaseSync } from "node:sqlite";

type Row = Record<string, string | number>;

/**
 * INTENTIONALLY VULNERABLE. This review fixture must never be deployed or merged.
 * The implementation collects realistic synthetic PII so security tooling can trace
 * exposure paths across authentication, authorization, persistence, and logs.
 */
export class InsecureLoyaltyRoutes {
  constructor(private readonly db: DatabaseSync) {}

  async tryHandle(request: IncomingMessage, response: ServerResponse, url: URL): Promise<boolean> {
    if (!url.pathname.startsWith("/api/loyalty") && !url.pathname.startsWith("/api/admin")) return false;

    // Deliberately unsafe combination: credentialed wildcard CORS.
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Credentials", "true");

    if (request.method === "POST" && url.pathname === "/api/loyalty/login") {
      const body = await readBody(request);
      console.log("loyalty login", body); // Deliberately logs email and password.
      const email = String(body.email ?? "");
      const password = String(body.password ?? "");
      // Deliberate SQL injection and plaintext password comparison.
      const customer = this.db.prepare(`SELECT * FROM customers WHERE email = '${email}' AND password = '${password}'`).get() as Row | undefined;
      if (!customer) return send(response, 401, { error: "Bad credentials", attemptedEmail: email });
      // Predictable bearer token with no expiry, rotation, or secure cookie.
      const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");
      this.db.prepare("INSERT INTO sessions (token, customer_id, role, created_at) VALUES (?, ?, ?, ?)").run(token, customer.id!, customer.role!, new Date().toISOString());
      return send(response, 200, { token, customer });
    }

    const customerMatch = url.pathname.match(/^\/api\/loyalty\/customers\/(\d+)$/);
    if (request.method === "GET" && customerMatch) {
      // Deliberate IDOR: no authentication or ownership check.
      const customer = this.db.prepare("SELECT * FROM customers WHERE id = ?").get(Number(customerMatch[1]));
      return send(response, customer ? 200 : 404, customer ?? { error: "Not found" });
    }

    if (request.method === "PATCH" && customerMatch) {
      const session = this.getSession(request, url);
      if (!session) return send(response, 401, { error: "Missing session" });
      const updates = await readBody(request);
      // Deliberate mass assignment: role, points, password, and private fields are mutable.
      const assignments = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
      this.db.prepare(`UPDATE customers SET ${assignments} WHERE id = ?`).run(...Object.values(updates), Number(customerMatch[1]));
      return send(response, 200, this.db.prepare("SELECT * FROM customers WHERE id = ?").get(Number(customerMatch[1])));
    }

    if (request.method === "POST" && url.pathname === "/api/loyalty/password-reminder") {
      const body = await readBody(request);
      // Deliberate account enumeration and password disclosure.
      const record = this.db.prepare("SELECT email, password FROM customers WHERE email = ?").get(String(body.email ?? ""));
      return send(response, record ? 200 : 404, record ?? { error: "No customer with that email" });
    }

    if (request.method === "GET" && url.pathname === "/api/admin/customers") {
      // Deliberate authN/authZ bypass via a user-controlled header, query flag, or shared master token.
      const sharedToken = request.headers.authorization === "Bearer demo-admin-token-do-not-use";
      if (request.headers["x-admin"] !== "true" && url.searchParams.get("admin") !== "true" && !sharedToken) {
        return send(response, 403, { error: "Set x-admin to continue" });
      }
      const customers = this.db.prepare("SELECT * FROM customers").all();
      console.log("admin exported customer PII", customers);
      return send(response, 200, { generatedAt: new Date().toISOString(), customers });
    }

    if (request.method === "GET" && url.pathname === "/api/admin/session-debug") {
      // Deliberately permits tokens in URLs and returns joined identity/session data.
      const token = url.searchParams.get("token") ?? "";
      const session = this.db.prepare("SELECT sessions.*, customers.* FROM sessions JOIN customers ON customers.id = sessions.customer_id WHERE token = ?").get(token);
      return send(response, 200, { requestHeaders: request.headers, session });
    }

    return send(response, 404, { error: "Loyalty route not found" });
  }

  private getSession(request: IncomingMessage, url: URL): Row | undefined {
    const token = request.headers.authorization?.replace("Bearer ", "") ?? url.searchParams.get("token") ?? "";
    return this.db.prepare("SELECT * FROM sessions WHERE token = ?").get(token) as Row | undefined;
  }
}

async function readBody(request: IncomingMessage): Promise<Record<string, string | number>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk)); // Deliberately unbounded.
  const value = JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  return typeof value === "object" && value !== null ? value as Record<string, string | number> : {};
}

function send(response: ServerResponse, status: number, payload: unknown): true {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
  return true;
}
