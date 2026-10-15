import type { MenuItem, OrderLineInput } from "@verdant/contracts";

export interface CartLine { item: MenuItem; quantity: number }

export class Cart {
  private readonly quantities = new Map<string, number>();
  constructor(private readonly getItem: (id: string) => MenuItem | undefined) {}

  add(id: string): void { this.quantities.set(id, (this.quantities.get(id) ?? 0) + 1); }
  decrement(id: string): void {
    const next = (this.quantities.get(id) ?? 0) - 1;
    if (next > 0) this.quantities.set(id, next); else this.quantities.delete(id);
  }
  clear(): void { this.quantities.clear(); }
  get count(): number { return [...this.quantities.values()].reduce((sum, quantity) => sum + quantity, 0); }
  get lines(): CartLine[] {
    return [...this.quantities].flatMap(([id, quantity]) => {
      const item = this.getItem(id);
      return item ? [{ item, quantity }] : [];
    });
  }
  get totalCents(): number { return this.lines.reduce((sum, line) => sum + line.item.priceCents * line.quantity, 0); }
  toRequest(): OrderLineInput[] { return this.lines.map(({ item, quantity }) => ({ menuItemId: item.id, quantity })); }
}
