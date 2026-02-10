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
          { productId: "prod-07", quantity: 24, unitPrice: "8.50", confidence: "0.96" },
          { productId: "prod-46", quantity: 30, unitPrice: "18.99", confidence: "0.97" },
          { productId: "prod-39", quantity: 20, unitPrice: "16.99", confidence: "0.95" },
          { productId: "prod-11", quantity: 15, unitPrice: "42.99", confidence: "0.98" },
          { productId: "prod-09", quantity: 10, unitPrice: "45.00", confidence: "0.99" },
          { productId: "prod-21", quantity: 50, unitPrice: "14.99", confidence: "0.98" },
          { productId: "prod-27", quantity: 15, unitPrice: "18.99", confidence: "0.94" },
          { productId: "prod-32", quantity: 8, unitPrice: "64.99", confidence: "0.93" },
          { productId: "prod-35", quantity: 6, unitPrice: "42.50", confidence: "0.92" },
          { productId: "prod-01", quantity: 12, unitPrice: "18.50", confidence: "0.94" },
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

  // Value metrics endpoint — computes multi-dimensional value from order data
  app.get("/api/orders/:id/value-metrics", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) return res.status(404).json({ message: "Order not found" });

      const items = await storage.getOrderItems(order.id);
      const swaps = await storage.getSwapRecommendations(order.id);
      const products = await storage.getProducts();
      const getProduct = (id: string) => products.find((p: any) => p.id === id);

      let originalTotal = 0;
      let finalTotal = 0;
      let contractCompliantCount = 0;
      let preferredSupplierCount = 0;
      let totalCo2Original = 0;
      let totalCo2Final = 0;
      let totalRecycledContent = 0;
      const suppliers = new Set<string>();
      const categories = new Set<string>();
      let certifiedItemCount = 0;
      let ecoItemCount = 0;

      for (const item of items) {
        const product = getProduct(item.productId);
        const originalProduct = getProduct(item.originalProductId || item.productId);
        if (!product) continue;

        const price = parseFloat(product.unitPrice) * item.quantity;
        finalTotal += price;

        if (originalProduct) {
          originalTotal += parseFloat(originalProduct.unitPrice) * item.quantity;
          totalCo2Original += (originalProduct.co2PerUnit || 0) * item.quantity;
        }

        totalCo2Final += (product.co2PerUnit || 0) * item.quantity;
        if (product.contract) contractCompliantCount++;
        if (product.preferredSupplier) preferredSupplierCount++;
        if (product.recycledContent) totalRecycledContent += product.recycledContent;
        if (product.certifications && product.certifications.length > 0) certifiedItemCount++;
        if (product.isEco) ecoItemCount++;
        suppliers.add(product.supplier);
        if (product.category) categories.add(product.category);
      }

      const acceptedSwaps = swaps.filter((s: any) => s.isAccepted);
      const stockSwaps = swaps.filter((s: any) => s.swapType === 'stock');
      const ecoSwaps = swaps.filter((s: any) => s.swapType === 'sustainability');
      const totalSavings = originalTotal - finalTotal;

      // Maverick spend prevention: estimated 15% premium avoided by using cooperative pricing
      const maverickSpendAvoided = finalTotal * 0.15;
      // Stockout cost avoidance: rush shipping + downtime estimate per stockout risk
      const stockoutCostAvoided = stockSwaps.length * 350;
      // CO2 reduction from swaps
      const co2Reduction = Math.max(0, totalCo2Original - totalCo2Final);
      const avgRecycledContent = items.length > 0 ? Math.round(totalRecycledContent / items.length) : 0;

      res.json({
        directSavings: totalSavings,
        maverickSpendAvoided,
        stockoutCostAvoided,
        contractCompliance: {
          compliantCount: contractCompliantCount,
          totalCount: items.length,
          rate: items.length > 0 ? Math.round((contractCompliantCount / items.length) * 100) : 0
        },
        sustainability: {
          co2ReductionKg: parseFloat(co2Reduction.toFixed(1)),
          ecoItemCount,
          ecoSwapsAvailable: ecoSwaps.length,
          ecoSwapsAccepted: ecoSwaps.filter((s: any) => s.isAccepted).length,
          avgRecycledContent,
          certifiedItemCount
        },
        spendConsolidation: {
          supplierCount: suppliers.size,
          categoryCount: categories.size,
          preferredSupplierCount
        },
        swapSummary: {
          total: swaps.length,
          accepted: acceptedSwaps.length,
          totalPotentialSavings: swaps.reduce((acc: number, s: any) => acc + Math.max(0, parseFloat(s.savingsAmount || "0")), 0),
          realizedSavings: acceptedSwaps.reduce((acc: number, s: any) => acc + Math.max(0, parseFloat(s.savingsAmount || "0")), 0)
        },
        totalValueCreated: totalSavings + maverickSpendAvoided + stockoutCostAvoided
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to compute value metrics" });
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
      const nonDistinctive = new Set([
        "heavy", "duty", "industrial", "eco", "economy", "premium", "white", "black",
        "blue", "red", "green", "yellow", "clear", "medium", "large", "small", "standard",
        "professional", "commercial", "general", "purpose", "multi", "grade", "type",
        "class", "pro", "plus", "max", "lite", "basic", "value", "pack", "case",
        "box", "each", "per", "roll", "sheet", "count", "powder", "free", "disposable",
      ]);
      const keywords = currentName.split(/[\s\-()\/]+/)
        .filter((w: string) => w.length > 2 && !nonDistinctive.has(w));
      const currentCategory = currentProduct.category || '';
      const currentUnspsc = currentProduct.unspsc || '';

      const alternatives = products
        .filter((p: any) => {
          if (p.id === item.productId || usedAlternatives.has(p.id)) return false;
          const altName = p.name.toLowerCase();
          
          const unspscMatch = currentUnspsc && p.unspsc && 
            currentUnspsc.length >= 8 && p.unspsc.length >= 8 &&
            p.unspsc.substring(0, 8) === currentUnspsc.substring(0, 8);
          
          const matchingKeywords = keywords.filter((kw: string) => altName.includes(kw));
          const strongNameMatch = matchingKeywords.length >= 2 && p.category === currentCategory;
          
          return unspscMatch || strongNameMatch;
        })
        .map((alt: any) => {
          const altPrice = parseFloat(alt.unitPrice);
          const savings = (currentPrice - altPrice) * item.quantity;
          let priority = 0;
          let swapType = 'supplier';
          let reason = '';

          if (currentProduct.availability === 'Low Stock' && alt.availability === 'In Stock' && altPrice <= currentPrice * 1.15) {
            swapType = 'stock';
            const savingsNote = altPrice < currentPrice 
              ? ` and saves $${(savings).toFixed(2)} on this line`
              : altPrice > currentPrice 
              ? ` at only $${(altPrice - currentPrice).toFixed(2)}/unit premium`
              : '';
            reason = `Stock risk mitigated — ${currentProduct.name} shows limited availability. VIA detected ${alt.supplier} carries equivalent ${alt.name} with immediate fulfillment${savingsNote}`;
            priority = 100;
          } else if (alt.packSize && currentProduct.packSize && alt.packSize > currentProduct.packSize && altPrice / alt.packSize < currentPrice / currentProduct.packSize) {
            swapType = 'pack_size';
            const perUnitCurrent = currentPrice / currentProduct.packSize;
            const perUnitAlt = altPrice / alt.packSize;
            const perUnitSavings = ((perUnitCurrent - perUnitAlt) / perUnitCurrent * 100).toFixed(0);
            const totalSavings = (perUnitCurrent - perUnitAlt) * alt.packSize * item.quantity;
            reason = `Bulk optimization — VIA identified ${alt.packSize}-ct format from ${alt.supplier} is ${perUnitSavings}% cheaper per unit vs current ${currentProduct.packSize}-ct ($${perUnitAlt.toFixed(3)}/ea vs $${perUnitCurrent.toFixed(3)}/ea). Projected savings: $${totalSavings.toFixed(2)}`;
            priority = 80;
          } else if (alt.isEco && !currentProduct.isEco && altPrice <= currentPrice * 1.20) {
            swapType = 'sustainability';
            const certList = alt.certifications?.length ? alt.certifications.join(', ') : 'eco-certified';
            const co2Savings = (currentProduct.co2PerUnit && alt.co2PerUnit && alt.co2PerUnit < currentProduct.co2PerUnit)
              ? ` | ${((1 - alt.co2PerUnit / currentProduct.co2PerUnit) * 100).toFixed(0)}% lower carbon footprint (${alt.co2PerUnit} vs ${currentProduct.co2PerUnit} kg CO₂/unit)`
              : '';
            const recycledNote = alt.recycledContent > 0 ? ` | ${alt.recycledContent}% recycled content` : '';
            if (altPrice <= currentPrice) {
              reason = `Green swap at equal or lower cost — ${certList} certified${co2Savings}${recycledNote}. Meets Green Purchasing Policy with no budget impact`;
            } else {
              const premium = ((altPrice - currentPrice) / currentPrice * 100).toFixed(1);
              reason = `Sustainability upgrade — ${certList} certified at ${premium}% premium ($${(altPrice - currentPrice).toFixed(2)}/unit)${co2Savings}${recycledNote}. Advances sustainability mandate`;
            }
            priority = 60;
          } else if (savings > 0 && alt.supplier !== currentProduct.supplier) {
            swapType = 'supplier';
            const tierNote = alt.contractTier === 'Tier 1' ? ` under ${alt.contract || 'cooperative master agreement'} (Tier 1)` : '';
            const pctSavings = ((savings / (currentPrice * item.quantity)) * 100).toFixed(0);
            reason = `VIA price analysis — ${alt.supplier}${tierNote} offers ${alt.name} at $${altPrice.toFixed(2)}/unit vs $${currentPrice.toFixed(2)}/unit. Line savings: $${savings.toFixed(2)} (${pctSavings}% reduction across ${item.quantity} units)`;
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
