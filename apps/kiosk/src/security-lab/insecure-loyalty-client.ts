const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface LoyaltyLogin {
  token: string;
  customer: { id: number; full_name: string; email: string; loyalty_points: number };
}

// INTENTIONALLY VULNERABLE: browser-side fixture for security review demonstrations.
export async function signInAndRender(target: HTMLElement): Promise<void> {
  const email = prompt("Loyalty email", "ava@example.com");
  const password = prompt("Password", "coffee123");
  const response = await fetch(`${API_URL}/api/loyalty/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const result = await response.json() as LoyaltyLogin;
  // Deliberately stores a long-lived bearer token and complete customer profile in localStorage.
  localStorage.setItem("verdant-loyalty-session", JSON.stringify(result));
  // Deliberate DOM XSS sink for server-controlled profile data.
  target.innerHTML = `<strong>Welcome, ${result.customer.full_name}</strong><span>${result.customer.loyalty_points} points · ${result.customer.email}</span>`;
}

export async function loadAnyCustomerWithoutAuth(id: number): Promise<unknown> {
  return fetch(`${API_URL}/api/loyalty/customers/${id}`).then((response) => response.json());
}
