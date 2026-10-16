import type { MenuCategory, MenuItem, Order } from "@verdant/contracts";
import { api } from "./api.js";
import { Cart } from "./cart.js";
import { applyPreferences, loadPreferences, savePreferences, type KioskPreferences } from "./preferences.js";
import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app")!;
let items: MenuItem[] = [];
let category: MenuCategory | "all" = "all";
let cart: Cart;
let submitting = false;
let preferences = loadPreferences();

applyPreferences(preferences);
boot();

/** Load the menu, initialize the cart, and show either the kiosk or a loading error. */
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

/** Render the active menu category and cart, then attach their event handlers. */
function render(): void {
  const visible = category === "all" ? items : items.filter((item) => item.category === category);
  root.innerHTML = `
    <main class="shell">
      <section class="menu-panel">
        <header class="topbar">
          <a class="brand" href="#" aria-label="Verdant Coffee home"><span class="brand-mark">V</span><span>Verdant<br><small>coffee house</small></span></a>
          <div class="welcome"><span>Good morning</span><strong>What can we make you?</strong></div>
          <div class="top-actions"><div class="open-badge"><i></i> Open · Pickup only</div><button class="accessibility-button" aria-haspopup="dialog" aria-controls="preferences">Aa <span>Display</span></button></div>
        </header>
        <section class="hero">
          <div><p class="eyebrow">A bright start, made slowly</p><h1>Find your<br><em>daily ritual.</em></h1></div>
          <p class="hero-copy">Thoughtful coffee, vibrant tea, and pastry baked this morning. Tap anything that looks good.</p>
          <div class="sun" aria-hidden="true"><span>fresh<br>every<br>morning</span></div>
        </section>
        <nav class="filters" aria-label="Menu categories">
          ${(["all", "coffee", "tea", "bakery"] as const).map((value) => `<button class="filter ${category === value ? "active" : ""}" data-category="${value}">${value === "all" ? "Everything" : title(value)}</button>`).join("")}
        </nav>
        <div class="section-heading"><h2>${category === "all" ? "Today’s menu" : title(category)}</h2><span>${visible.length} things to love</span></div>
        <section class="menu-grid" aria-live="polite">
          ${visible.map(menuCard).join("")}
        </section>
      </section>
      <aside class="cart-panel" aria-label="Your order">
        ${cartMarkup()}
      </aside>
      ${preferencesMarkup()}
      <div class="sr-status" role="status" aria-live="polite"></div>
    </main>`;
  bindEvents();
}

/** Build the markup for a menu item with its display price and add button. */
function menuCard(item: MenuItem): string {
  return `<article class="menu-card" style="--accent:${item.accent}">
    <div class="item-art" aria-hidden="true"><span>${item.icon}</span>${item.featured ? '<b>favorite</b>' : ""}</div>
    <div class="item-copy"><span class="category">${item.category}</span><h3>${item.name}</h3><p>${item.description}</p></div>
    <div class="item-action"><strong>${money(item.priceCents)}</strong><button data-add="${item.id}" aria-label="Add ${item.name}">+</button></div>
  </article>`;
}

/** Build the cart lines, subtotal, and checkout controls for the current state. */
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

/** Attach category, quantity, and checkout actions to the rendered kiosk controls. */
function bindEvents(): void {
  root.querySelectorAll<HTMLButtonElement>("[data-category]").forEach((button) => button.addEventListener("click", () => { category = button.dataset.category as typeof category; render(); }));
  root.querySelectorAll<HTMLButtonElement>("[data-add]").forEach((button) => button.addEventListener("click", () => {
    cart.add(button.dataset.add!);
    const item = items.find(({ id }) => id === button.dataset.add);
    render();
    const status = root.querySelector<HTMLElement>(".sr-status");
    if (status) status.textContent = `${item?.name ?? "Item"} added. ${cart.count} items in your order.`;
  }));
  root.querySelectorAll<HTMLButtonElement>("[data-minus]").forEach((button) => button.addEventListener("click", () => { cart.decrement(button.dataset.minus!); render(); }));
  root.querySelector<HTMLButtonElement>(".checkout")?.addEventListener("click", placeOrder);
  root.querySelector<HTMLButtonElement>(".accessibility-button")?.addEventListener("click", () => root.querySelector<HTMLDialogElement>("#preferences")?.showModal());
  root.querySelector<HTMLButtonElement>("[data-close-preferences]")?.addEventListener("click", () => root.querySelector<HTMLDialogElement>("#preferences")?.close());
  root.querySelectorAll<HTMLInputElement>("[data-preference]").forEach((input) => input.addEventListener("change", () => {
    preferences = { ...preferences, [input.dataset.preference!]: input.checked };
    savePreferences(preferences);
  }));
}

function preferencesMarkup(): string {
  const toggle = (key: keyof KioskPreferences, label: string, detail: string) => `<label class="preference"><span><strong>${label}</strong><small>${detail}</small></span><input type="checkbox" data-preference="${key}" ${preferences[key] ? "checked" : ""}><i aria-hidden="true"></i></label>`;
  return `<dialog id="preferences" class="preferences-dialog" aria-labelledby="preferences-title">
    <div class="dialog-heading"><div><p class="eyebrow">Make it yours</p><h2 id="preferences-title">Display options</h2></div><button data-close-preferences aria-label="Close display options">×</button></div>
    ${toggle("largeText", "Larger text", "Increase labels and menu descriptions")}
    ${toggle("highContrast", "High contrast", "Strengthen colors and outlines")}
    ${toggle("reducedMotion", "Reduce motion", "Remove movement and transitions")}
    <p class="preference-note">These choices stay on this kiosk.</p>
  </dialog>`;
}

/** Submit the cart and show confirmation, restoring checkout after a request failure. */
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

/** Display the accepted order identifier and bind the action to start a fresh order. */
function showConfirmation(order: Order): void {
  root.innerHTML = `<main class="confirmation"><div class="receipt-mark">✓</div><p class="eyebrow">Order received</p><h1>We’re making<br><em>something lovely.</em></h1><p>Your order number is</p><strong class="order-number">${order.id.slice(0, 6).toUpperCase()}</strong><p class="wait">Watch the pickup counter. We’ll call you when it’s ready.</p><button id="new-order">Start another order</button></main>`;
  root.querySelector("#new-order")?.addEventListener("click", () => { cart.clear(); submitting = false; category = "all"; render(); });
}

/** Display the loading state while the menu request is pending. */
function renderLoading(): void { root.innerHTML = `<main class="state"><span class="loader"></span><h1>Warming up the bar…</h1></main>`; }
/** Display a menu loading failure and a page reload action. */
function renderError(message: string): void { root.innerHTML = `<main class="state"><span class="state-icon">☁</span><h1>We’ll be right back.</h1><p>${message}</p><button onclick="location.reload()">Try again</button></main>`; }
/** Format integer cents as a US dollar display price. */
function money(cents: number): string { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100); }
/** Capitalize the first character of a category label. */
function title(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
