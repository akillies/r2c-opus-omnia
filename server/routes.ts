import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertOrderItemSchema, insertSwapRecommendationSchema } from "@shared/schema";
import { z } from "zod";
import { parseCSV, parseExcel } from "./file-parser";
import { productMatcher } from "./matching";

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

  // Parse uploaded file
  app.post("/api/parse-file", async (req, res) => {
    try {
      const { content, fileName, fileType } = req.body;
      
      if (!content || !fileName) {
        return res.status(400).json({ message: "File content and name required" });
      }

      let parsedResult;
      
      if (fileType === 'csv' || fileName.endsWith('.csv')) {
        parsedResult = parseCSV(content, fileName);
      } else if (fileType === 'excel' || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = Buffer.from(content, 'base64');
        parsedResult = parseExcel(buffer, fileName);
      } else {
        return res.status(400).json({ message: "Unsupported file type. Use CSV or Excel." });
      }

      const products = await storage.getProducts();
      productMatcher.initialize(products);
      const matchedItems = productMatcher.matchItems(parsedResult.items);

      res.json({
        fileName: parsedResult.fileName,
        rowCount: parsedResult.rowCount,
        items: parsedResult.items,
        matchedItems
      });
    } catch (error) {
      console.error('Parse error:', error);
      res.status(500).json({ message: "Failed to parse file" });
    }
  });

  // Create order with matched items
  app.post("/api/orders", async (req, res) => {
    try {
      const { fileName, matchedItems } = req.body;
      
      const orderData = insertOrderSchema.parse({
        fileName: fileName || "uploaded-file",
        status: "processing"
      });
      const order = await storage.createOrder(orderData);

      const products = await storage.getProducts();
      let orderItems = [];

      if (matchedItems && matchedItems.length > 0) {
        for (const match of matchedItems) {
          if (match.matchedProduct) {
            const orderItem = await storage.createOrderItem({
              orderId: order.id,
              productId: match.matchedProduct.id,
              quantity: match.quantity || 1,
              unitPrice: match.matchedProduct.unitPrice,
              confidence: match.confidence || "0.85",
              isSwapped: false
            });
            orderItems.push(orderItem);
          }
        }
      } else {
        const sampleItems = [
          { productId: "prod-01", quantity: 12, unitPrice: "18.50", confidence: "0.98" },
          { productId: "prod-04", quantity: 48, unitPrice: "18.75", confidence: "0.93" },
          { productId: "prod-05", quantity: 72, unitPrice: "4.25", confidence: "0.97" },
          { productId: "prod-07", quantity: 24, unitPrice: "8.50", confidence: "0.92" },
          { productId: "prod-09", quantity: 10, unitPrice: "45.00", confidence: "0.99" },
          { productId: "prod-13", quantity: 50, unitPrice: "42.00", confidence: "0.96" },
          { productId: "prod-24", quantity: 30, unitPrice: "11.50", confidence: "0.91" },
          { productId: "prod-26", quantity: 20, unitPrice: "18.99", confidence: "0.95" },
          { productId: "prod-33", quantity: 40, unitPrice: "58.00", confidence: "0.94" },
          { productId: "prod-46", quantity: 24, unitPrice: "62.50", confidence: "0.97" },
        ];

        for (const item of sampleItems) {
          const orderItem = await storage.createOrderItem({
            orderId: order.id,
            ...item,
            isSwapped: false
          });
          orderItems.push(orderItem);
        }
      }

      const swapRecommendations = generateSwapRecommendations(order.id, orderItems, products);
      for (const swap of swapRecommendations) {
        await storage.createSwapRecommendation(swap);
      }

      res.json({ order, items: orderItems });
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  function generateSwapRecommendations(orderId: string, orderItems: any[], products: any[]): any[] {
    const recommendations: any[] = [];
    const usedAlternatives = new Set<string>();
    
    for (const item of orderItems) {
      const currentProduct = products.find((p: any) => p.id === item.productId);
      if (!currentProduct) continue;

      const currentPrice = parseFloat(currentProduct.unitPrice);
      const currentName = currentProduct.name.toLowerCase();
      const keywords = currentName.split(/[\s\-()]+/).filter((w: string) => w.length > 3);

      const alternatives = products
        .filter((p: any) => {
          if (p.id === item.productId || usedAlternatives.has(p.id)) return false;
          const altName = p.name.toLowerCase();
          return keywords.some((kw: string) => altName.includes(kw)) || p.category === currentProduct.category;
        })
        .map((alt: any) => {
          const altPrice = parseFloat(alt.unitPrice);
          const savings = (currentPrice - altPrice) * item.quantity;
          let priority = 0;
          let swapType = 'supplier';
          let reason = '';

          if (currentProduct.availability === 'Low Stock' && alt.availability === 'In Stock' && altPrice <= currentPrice * 1.05) {
            swapType = 'stock';
            reason = `Stock risk avoided — ${currentProduct.name} is low stock, this equivalent ships immediately`;
            priority = 100;
          } else if (alt.unitOfMeasure !== currentProduct.unitOfMeasure && altPrice < currentPrice && savings > 0) {
            swapType = 'pack_size';
            const perUnitSavings = ((currentPrice - altPrice) / currentPrice * 100).toFixed(0);
            reason = `Bulk savings — ${alt.unitOfMeasure} format is ${perUnitSavings}% cheaper per unit than ${currentProduct.unitOfMeasure}`;
            priority = 80;
          } else if (alt.isEco && !currentProduct.isEco && altPrice <= currentPrice * 1.1) {
            swapType = 'sustainability';
            if (altPrice <= currentPrice) {
              reason = `Eco-friendly alternative at same or lower price — meets Green Purchasing Policy`;
            } else {
              reason = `Eco-certified option at only $${(altPrice - currentPrice).toFixed(2)}/unit more — aligns with sustainability mandate`;
            }
            priority = 60;
          } else if (savings > 0 && alt.supplier !== currentProduct.supplier) {
            swapType = 'supplier';
            reason = `Better price from ${alt.supplier} — saves $${savings.toFixed(2)} on this line (${((savings / (currentPrice * item.quantity)) * 100).toFixed(0)}% reduction)`;
            priority = 70;
          } else if (alt.supplier !== currentProduct.supplier && altPrice < currentPrice) {
            swapType = 'supplier';
            reason = `Competitive alternative from ${alt.supplier} — lower cost with same quality`;
            priority = 40;
          }

          const effectiveSavings = Math.max(0, savings);
          return { alt, savings: effectiveSavings, swapType, reason, priority };
        })
        .filter((r: any) => r.reason.length > 0)
        .sort((a: any, b: any) => b.priority - a.priority);

      const bestSwap = alternatives[0];
      if (bestSwap) {
        usedAlternatives.add(bestSwap.alt.id);
        recommendations.push({
          orderId,
          originalProductId: item.productId,
          recommendedProductId: bestSwap.alt.id,
          swapType: bestSwap.swapType,
          savingsAmount: bestSwap.savings.toFixed(2),
          reason: bestSwap.reason
        });
      }
    }

    return recommendations;
  }

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
