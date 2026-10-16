import type { MenuItem, OrderLineInput } from "@verdant/contracts";

export interface CartLine { item: MenuItem; quantity: number }

export class Cart {
  private readonly quantities = new Map<string, number>();
  /** Resolve cart item identifiers against the current menu using the supplied lookup. */
  constructor(private readonly getItem: (id: string) => MenuItem | undefined) {}

  /** Increase the quantity of an item by one. */
  add(id: string): void { this.quantities.set(id, (this.quantities.get(id) ?? 0) + 1); }
  /** Decrease an item quantity by one, removing the entry when it reaches zero. */
  decrement(id: string): void {
    const next = (this.quantities.get(id) ?? 0) - 1;
    if (next > 0) this.quantities.set(id, next); else this.quantities.delete(id);
  }
  /** Remove all item quantities from the cart. */
  clear(): void { this.quantities.clear(); }
  /** Return the total number of units in the cart. */
  get count(): number { return [...this.quantities.values()].reduce((sum, quantity) => sum + quantity, 0); }
  /** Resolve cart entries into menu items, omitting items absent from the current menu. */
  get lines(): CartLine[] {
    return [...this.quantities].flatMap(([id, quantity]) => {
      const item = this.getItem(id);
      return item ? [{ item, quantity }] : [];
    });
  }
  /** Calculate the displayed subtotal in cents from resolved cart lines. */
  get totalCents(): number { return this.lines.reduce((sum, line) => sum + line.item.priceCents * line.quantity, 0); }
  /** Serialize resolved cart lines as item identifiers and quantities for the API. */
  toRequest(): OrderLineInput[] { return this.lines.map(({ item, quantity }) => ({ menuItemId: item.id, quantity })); }
}
