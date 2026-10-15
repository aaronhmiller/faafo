import type { DietaryPreference, MenuCategory, MenuItem, Order, OrderMood, Recommendation } from "@verdant/contracts";
import { api } from "./api.js";
import { Cart } from "./cart.js";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app")!;
let items: MenuItem[] = [];
let category: MenuCategory | "all" = "all";
let cart: Cart;
let submitting = false;
let recommending = false;
let mood: OrderMood = "bright";
let dietaryPreferences: DietaryPreference[] = [];
let recommendations = new Map<string, Recommendation>();
let recommendationSource: "ai" | "fallback" | undefined;

boot();

async function boot(): Promise<void> {
  renderLoading();
  try {
    const menu = await api.menu();
    items = menu.items;
    cart = new Cart((id) => items.find((item) => item.id === id));
    render();
  } catch (error) {
    renderError(error instanceof Error ? error.message : "The menu is taking a coffee break.");
  }
}

function render(): void {
  const visible = category === "all" ? items : items.filter((item) => item.category === category);
  root.innerHTML = `
    <main class="shell">
      <section class="menu-panel">
        <header class="topbar">
          <a class="brand" href="#" aria-label="Verdant Coffee home"><span class="brand-mark">V</span><span>Verdant<br><small>coffee house</small></span></a>
          <div class="welcome"><span>Good morning</span><strong>What can we make you?</strong></div>
          <div class="open-badge"><i></i> Open · Pickup only</div>
        </header>
        <section class="hero">
          <div><p class="eyebrow">A bright start, made slowly</p><h1>Find your<br><em>daily ritual.</em></h1></div>
          <p class="hero-copy">Thoughtful coffee, vibrant tea, and pastry baked this morning. Tap anything that looks good.</p>
          <div class="sun" aria-hidden="true"><span>fresh<br>every<br>morning</span></div>
        </section>
        <nav class="filters" aria-label="Menu categories">
          ${(["all", "coffee", "tea", "bakery"] as const).map((value) => `<button class="filter ${category === value ? "active" : ""}" data-category="${value}">${value === "all" ? "Everything" : title(value)}</button>`).join("")}
        </nav>
        ${conciergeMarkup()}
        <div class="section-heading"><h2>${category === "all" ? "Today’s menu" : title(category)}</h2><span>${visible.length} things to love</span></div>
        <section class="menu-grid" aria-live="polite">
          ${visible.map(menuCard).join("")}
        </section>
      </section>
      <aside class="cart-panel" aria-label="Your order">
        ${cartMarkup()}
      </aside>
    </main>`;
  bindEvents();
}

function menuCard(item: MenuItem): string {
  const recommendation = recommendations.get(item.id);
  return `<article class="menu-card" style="--accent:${item.accent}">
    <div class="item-art" aria-hidden="true"><span>${item.icon}</span>${recommendation ? '<b class="ai-pick">for you</b>' : item.featured ? '<b>favorite</b>' : ""}</div>
    <div class="item-copy"><span class="category">${item.category}</span><h3>${item.name}</h3><p>${item.description}</p></div>
    ${recommendation ? `<p class="recommendation-reason">✦ ${recommendation.reason}</p>` : ""}
    <div class="item-action"><strong>${money(item.priceCents)}</strong><button data-add="${item.id}" aria-label="Add ${item.name}">+</button></div>
  </article>`;
}

function conciergeMarkup(): string {
  const moodOptions: OrderMood[] = ["bright", "cozy", "focused", "adventurous"];
  const dietOptions: DietaryPreference[] = ["dairy-free", "nut-free", "vegan"];
  return `<section class="concierge" aria-labelledby="concierge-title">
    <div class="concierge-intro"><span class="spark">✦</span><div><p class="eyebrow">Verdant guide</p><h2 id="concierge-title">What fits your moment?</h2><p>Tell our menu guide the vibe. It only recommends available items that match your filters.</p></div></div>
    <div class="concierge-controls">
      <div><span class="control-label">I’m feeling</span><div class="choice-row">${moodOptions.map((value) => `<button class="choice ${mood === value ? "selected" : ""}" data-mood="${value}">${title(value)}</button>`).join("")}</div></div>
      <div><span class="control-label">Keep it</span><div class="choice-row">${dietOptions.map((value) => `<button class="choice ${dietaryPreferences.includes(value) ? "selected" : ""}" data-diet="${value}">${title(value)}</button>`).join("")}</div></div>
    </div>
    <div class="concierge-action"><button data-recommend ${recommending ? "disabled" : ""}>${recommending ? "Thinking…" : "Find my match"} <span>✦</span></button>${recommendationSource ? `<small>${recommendationSource === "ai" ? "AI-curated" : "House-curated fallback"} · Check ingredients with a barista for allergies.</small>` : ""}</div>
  </section>`;
}

function cartMarkup(): string {
  const lines = cart.lines;
  return `<div class="cart-header"><div><span class="eyebrow">Your order</span><h2>A little joy<br>to go.</h2></div><span class="cart-count">${cart.count}</span></div>
    <div class="cart-lines">
      ${lines.length === 0 ? `<div class="empty-cart"><span>☕</span><h3>Your tray is empty</h3><p>Add a drink or bite from the menu.</p></div>` : lines.map(({ item, quantity }) => `<div class="cart-line"><div><strong>${item.name}</strong><span>${money(item.priceCents)} each</span></div><div class="stepper"><button data-minus="${item.id}" aria-label="Remove one ${item.name}">−</button><b>${quantity}</b><button data-add="${item.id}" aria-label="Add one ${item.name}">+</button></div></div>`).join("")}
    </div>
    <div class="cart-footer">
      <div class="total"><span>Total <small>Tax included</small></span><strong>${money(cart.totalCents)}</strong></div>
      <button class="checkout" ${lines.length === 0 || submitting ? "disabled" : ""}>${submitting ? "Sending to the bar…" : "Place order"}<span>→</span></button>
      <p>Made with care · Typical wait 5–8 minutes</p>
    </div>`;
}

function bindEvents(): void {
  root.querySelectorAll<HTMLButtonElement>("[data-category]").forEach((button) => button.addEventListener("click", () => { category = button.dataset.category as typeof category; render(); }));
  root.querySelectorAll<HTMLButtonElement>("[data-add]").forEach((button) => button.addEventListener("click", () => { cart.add(button.dataset.add!); render(); }));
  root.querySelectorAll<HTMLButtonElement>("[data-minus]").forEach((button) => button.addEventListener("click", () => { cart.decrement(button.dataset.minus!); render(); }));
  root.querySelector<HTMLButtonElement>(".checkout")?.addEventListener("click", placeOrder);
  root.querySelectorAll<HTMLButtonElement>("[data-mood]").forEach((button) => button.addEventListener("click", () => { mood = button.dataset.mood as OrderMood; render(); }));
  root.querySelectorAll<HTMLButtonElement>("[data-diet]").forEach((button) => button.addEventListener("click", () => {
    const preference = button.dataset.diet as DietaryPreference;
    dietaryPreferences = dietaryPreferences.includes(preference) ? dietaryPreferences.filter((value) => value !== preference) : [...dietaryPreferences, preference];
    render();
  }));
  root.querySelector<HTMLButtonElement>("[data-recommend]")?.addEventListener("click", requestRecommendations);
}

async function requestRecommendations(): Promise<void> {
  recommending = true;
  render();
  try {
    const response = await api.recommendations({ mood, dietaryPreferences, cartItemIds: cart.lines.map(({ item }) => item.id) });
    recommendations = new Map(response.recommendations.map((item) => [item.menuItemId, item]));
    recommendationSource = response.source;
  } catch (error) {
    alert(error instanceof Error ? error.message : "The menu guide is unavailable.");
  } finally {
    recommending = false;
    render();
  }
}

async function placeOrder(): Promise<void> {
  submitting = true;
  render();
  try {
    const order = await api.createOrder({ lines: cart.toRequest() });
    showConfirmation(order);
  } catch (error) {
    submitting = false;
    render();
    alert(error instanceof Error ? error.message : "We could not place your order.");
  }
}

function showConfirmation(order: Order): void {
  root.innerHTML = `<main class="confirmation"><div class="receipt-mark">✓</div><p class="eyebrow">Order received</p><h1>We’re making<br><em>something lovely.</em></h1><p>Your order number is</p><strong class="order-number">${order.id.slice(0, 6).toUpperCase()}</strong><p class="wait">Watch the pickup counter. We’ll call you when it’s ready.</p><button id="new-order">Start another order</button></main>`;
  root.querySelector("#new-order")?.addEventListener("click", () => { cart.clear(); submitting = false; category = "all"; render(); });
}

function renderLoading(): void { root.innerHTML = `<main class="state"><span class="loader"></span><h1>Warming up the bar…</h1></main>`; }
function renderError(message: string): void { root.innerHTML = `<main class="state"><span class="state-icon">☁</span><h1>We’ll be right back.</h1><p>${message}</p><button onclick="location.reload()">Try again</button></main>`; }
function money(cents: number): string { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100); }
function title(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
