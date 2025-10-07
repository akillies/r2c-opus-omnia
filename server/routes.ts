import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertOrderItemSchema, insertSwapRecommendationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Products
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Create order with file upload simulation
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);

      // Create sample order items based on the uploaded file
      const sampleItems = [
        { productId: "prod-1", quantity: 48, unitPrice: "18.50", confidence: "0.98" },
        { productId: "prod-2", quantity: 200, unitPrice: "2.75", confidence: "0.95" },
        { productId: "prod-3", quantity: 72, unitPrice: "4.25", confidence: "0.99" },
        { productId: "prod-4", quantity: 24, unitPrice: "8.50", confidence: "0.92" },
        { productId: "prod-5", quantity: 500, unitPrice: "0.45", confidence: "0.97" }
      ];

      const orderItems = [];
      for (const item of sampleItems) {
        const orderItem = await storage.createOrderItem({
          orderId: order.id,
          ...item,
          isSwapped: false
        });
        orderItems.push(orderItem);
      }

      // Create sample swap recommendations
      const swapRecommendations = [
        {
          orderId: order.id,
          originalProductId: "prod-1",
          recommendedProductId: "prod-1-alt",
          swapType: "pack_size",
          savingsAmount: "72.48",
          reason: "Pack size optimization - Same spec, 8% lower unit cost"
        },
        {
          orderId: order.id,
          originalProductId: "prod-2",
          recommendedProductId: "prod-2-alt",
          swapType: "supplier",
          savingsAmount: "60.00",
          reason: "Alternative supplier - Better pricing, same delivery window"
        },
        {
          orderId: order.id,
          originalProductId: "prod-4",
          recommendedProductId: "prod-4-alt",
          swapType: "stock",
          savingsAmount: "-6.00",
          reason: "Stock availability - Original low stock, this ships same day"
        },
        {
          orderId: order.id,
          originalProductId: "prod-5",
          recommendedProductId: "prod-5-alt",
          swapType: "sustainability",
          savingsAmount: "-10.00",
          reason: "Sustainability match - 80% recycled content, meets sustainability goals"
        }
      ];

      for (const swap of swapRecommendations) {
        await storage.createSwapRecommendation(swap);
      }

      res.json({ order, items: orderItems });
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  // Get order with items and swaps
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const items = await storage.getOrderItems(order.id);
      const swaps = await storage.getSwapRecommendations(order.id);

      res.json({ order, items, swaps });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Accept swap recommendation
  app.post("/api/orders/:orderId/swaps/:swapId/accept", async (req, res) => {
    try {
      const { orderId, swapId } = req.params;
      
      const swap = await storage.updateSwapRecommendation(swapId, { isAccepted: true });
      if (!swap) {
        return res.status(404).json({ message: "Swap not found" });
      }

      // Update the order item to use the recommended product
      const items = await storage.getOrderItems(orderId);
      const targetItem = items.find(item => item.productId === swap.originalProductId && !item.isSwapped);
      
      if (targetItem) {
        await storage.updateOrderItem(targetItem.id, {
          productId: swap.recommendedProductId,
          isSwapped: true,
          originalProductId: swap.originalProductId
        });
      }

      res.json({ success: true, swap });
    } catch (error) {
      res.status(500).json({ message: "Failed to accept swap" });
    }
  });

  // Submit final order
  app.post("/api/orders/:id/submit", async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, { status: "submitted" });
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Generate order ID
      const orderNumber = `PO-2024-${Math.floor(Math.random() * 9000) + 1000}`;
      
      res.json({ success: true, orderNumber, order });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit order" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
