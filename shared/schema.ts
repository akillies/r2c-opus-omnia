import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  unitOfMeasure: text("unit_of_measure").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  supplier: text("supplier").notNull(),
  contract: text("contract"),
  availability: text("availability").notNull().default("In Stock"),
  isEco: boolean("is_eco").default(false),
  category: text("category"),
  specifications: jsonb("specifications"),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name"),
  status: text("status").notNull().default("processing"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  totalSavings: decimal("total_savings", { precision: 10, scale: 2 }).default("0"),
  itemsData: jsonb("items_data"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  isSwapped: boolean("is_swapped").default(false),
  originalProductId: varchar("original_product_id"),
});

export const swapRecommendations = pgTable("swap_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  originalProductId: varchar("original_product_id").notNull(),
  recommendedProductId: varchar("recommended_product_id").notNull(),
  swapType: text("swap_type").notNull(), // pack_size, supplier, stock, sustainability
  savingsAmount: decimal("savings_amount", { precision: 10, scale: 2 }),
  reason: text("reason"),
  isAccepted: boolean("is_accepted").default(false),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertSwapRecommendationSchema = createInsertSchema(swapRecommendations).omit({
  id: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type SwapRecommendation = typeof swapRecommendations.$inferSelect;
export type InsertSwapRecommendation = z.infer<typeof insertSwapRecommendationSchema>;
