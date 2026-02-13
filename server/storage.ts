import { 
  type Product, type InsertProduct, 
  type Order, type InsertOrder, 
  type OrderItem, type InsertOrderItem, 
  type SwapRecommendation, type InsertSwapRecommendation,
  products, orders, orderItems, swapRecommendations 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order | undefined>;

  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: string, orderItem: Partial<OrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: string): Promise<boolean>;

  // Swap Recommendations
  getSwapRecommendations(orderId: string): Promise<SwapRecommendation[]>;
  createSwapRecommendation(swap: InsertSwapRecommendation): Promise<SwapRecommendation>;
  updateSwapRecommendation(id: string, swap: Partial<SwapRecommendation>): Promise<SwapRecommendation | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async updateOrder(id: string, orderUpdate: Partial<Order>): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set(orderUpdate)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItems)
      .values(insertOrderItem)
      .returning();
    return orderItem;
  }

  async updateOrderItem(id: string, orderItemUpdate: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const [orderItem] = await db
      .update(orderItems)
      .set(orderItemUpdate)
      .where(eq(orderItems.id, id))
      .returning();
    return orderItem || undefined;
  }

  async deleteOrderItem(id: string): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.id, id)).returning();
    return result.length > 0;
  }

  async getSwapRecommendations(orderId: string): Promise<SwapRecommendation[]> {
    return await db.select().from(swapRecommendations).where(eq(swapRecommendations.orderId, orderId));
  }

  async createSwapRecommendation(insertSwap: InsertSwapRecommendation): Promise<SwapRecommendation> {
    const [swap] = await db
      .insert(swapRecommendations)
      .values(insertSwap)
      .returning();
    return swap;
  }

  async updateSwapRecommendation(id: string, swapUpdate: Partial<SwapRecommendation>): Promise<SwapRecommendation | undefined> {
    const [swap] = await db
      .update(swapRecommendations)
      .set(swapUpdate)
      .where(eq(swapRecommendations.id, id))
      .returning();
    return swap || undefined;
  }
}

export const storage = new DatabaseStorage();
