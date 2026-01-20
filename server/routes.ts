import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertOrderItemSchema, insertSwapRecommendationSchema } from "@shared/schema";
import { z } from "zod";
import { parseCSV, parseExcel, matchItemsToProducts } from "./file-parser";

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
      const matchedItems = matchItemsToProducts(parsedResult.items, products);

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
          { productId: "prod-1", quantity: 48, unitPrice: "18.50", confidence: "0.98" },
          { productId: "prod-2", quantity: 200, unitPrice: "2.75", confidence: "0.95" },
          { productId: "prod-3", quantity: 72, unitPrice: "4.25", confidence: "0.99" },
          { productId: "prod-4", quantity: 24, unitPrice: "8.50", confidence: "0.92" },
          { productId: "prod-5", quantity: 500, unitPrice: "0.45", confidence: "0.97" }
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
    
    for (const item of orderItems) {
      const currentProduct = products.find(p => p.id === item.productId);
      if (!currentProduct) continue;

      const alternatives = products.filter(p => 
        p.id !== item.productId && 
        p.name.toLowerCase().includes(currentProduct.name.split(' ')[0].toLowerCase())
      );

      for (const alt of alternatives.slice(0, 1)) {
        const currentPrice = parseFloat(currentProduct.unitPrice);
        const altPrice = parseFloat(alt.unitPrice);
        const savings = (currentPrice - altPrice) * item.quantity;
        
        let swapType = 'supplier';
        let reason = 'Alternative option available';

        if (alt.unitOfMeasure !== currentProduct.unitOfMeasure) {
          swapType = 'pack_size';
          reason = `Pack size optimization - ${alt.unitOfMeasure} format available`;
        } else if (currentProduct.availability === 'Low Stock' && alt.availability === 'In Stock') {
          swapType = 'stock';
          reason = 'Stock availability - Better availability with this option';
        } else if (alt.isEco && !currentProduct.isEco) {
          swapType = 'sustainability';
          reason = 'Sustainability match - Eco-friendly alternative';
        } else if (alt.supplier !== currentProduct.supplier) {
          swapType = 'supplier';
          reason = `Alternative supplier - ${alt.supplier}`;
        }

        recommendations.push({
          orderId,
          originalProductId: item.productId,
          recommendedProductId: alt.id,
          swapType,
          savingsAmount: savings.toFixed(2),
          reason
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
