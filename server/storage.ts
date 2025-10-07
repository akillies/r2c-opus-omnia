import { type Product, type InsertProduct, type Order, type InsertOrder, type OrderItem, type InsertOrderItem, type SwapRecommendation, type InsertSwapRecommendation } from "@shared/schema";
import { randomUUID } from "crypto";

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

  // Swap Recommendations
  getSwapRecommendations(orderId: string): Promise<SwapRecommendation[]>;
  createSwapRecommendation(swap: InsertSwapRecommendation): Promise<SwapRecommendation>;
  updateSwapRecommendation(id: string, swap: Partial<SwapRecommendation>): Promise<SwapRecommendation | undefined>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private swapRecommendations: Map<string, SwapRecommendation>;

  constructor() {
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.swapRecommendations = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Initialize sample products
    const sampleProducts: Product[] = [
      {
        id: "prod-1",
        name: "Heavy-Duty Floor Cleaner Concentrate",
        description: "Industrial grade floor cleaner",
        unitOfMeasure: "Gallon",
        unitPrice: "18.50",
        supplier: "CleanPro Supply",
        contract: "STATE-EDU-ABC",
        availability: "In Stock",
        isEco: false,
        category: "Cleaning Supplies",
        specifications: {}
      },
      {
        id: "prod-1-alt",
        name: "Heavy-Duty Floor Cleaner Concentrate",
        description: "Same formula, bulk pack",
        unitOfMeasure: "Case/4gal",
        unitPrice: "16.99",
        supplier: "CleanPro Supply",
        contract: "STATE-EDU-ABC",
        availability: "In Stock",
        isEco: false,
        category: "Cleaning Supplies",
        specifications: {}
      },
      {
        id: "prod-2",
        name: "Microfiber Cleaning Cloths",
        description: "Professional grade microfiber cloths",
        unitOfMeasure: "Each",
        unitPrice: "2.75",
        supplier: "CleanPro Supply",
        contract: "STATE-EDU-ABC",
        availability: "In Stock",
        isEco: false,
        category: "Cleaning Supplies",
        specifications: {}
      },
      {
        id: "prod-2-alt",
        name: "Microfiber Cleaning Cloths",
        description: "Professional grade microfiber cloths",
        unitOfMeasure: "Each",
        unitPrice: "2.45",
        supplier: "Hygiene Plus",
        contract: "STATE-EDU-ABC",
        availability: "In Stock",
        isEco: false,
        category: "Cleaning Supplies",
        specifications: {}
      },
      {
        id: "prod-3",
        name: "Disinfectant Spray Bottles",
        description: "Commercial disinfectant spray",
        unitOfMeasure: "Each",
        unitPrice: "4.25",
        supplier: "Hygiene Plus",
        contract: "STATE-EDU-ABC",
        availability: "In Stock",
        isEco: false,
        category: "Cleaning Supplies",
        specifications: {}
      },
      {
        id: "prod-4",
        name: "Industrial Mop Heads",
        description: "Heavy-duty mop heads",
        unitOfMeasure: "Each",
        unitPrice: "8.50",
        supplier: "CleanPro Supply",
        contract: "STATE-EDU-ABC",
        availability: "Low Stock",
        isEco: false,
        category: "Cleaning Supplies",
        specifications: {}
      },
      {
        id: "prod-4-alt",
        name: "Industrial Mop Heads",
        description: "Heavy-duty mop heads",
        unitOfMeasure: "Each",
        unitPrice: "8.75",
        supplier: "Hygiene Plus",
        contract: "STATE-EDU-ABC",
        availability: "In Stock",
        isEco: false,
        category: "Cleaning Supplies",
        specifications: {}
      },
      {
        id: "prod-5",
        name: "Trash Can Liners 55gal",
        description: "Heavy-duty trash liners",
        unitOfMeasure: "Each",
        unitPrice: "0.45",
        supplier: "EcoSupply Co",
        contract: "STATE-EDU-ABC",
        availability: "In Stock",
        isEco: false,
        category: "Cleaning Supplies",
        specifications: {}
      },
      {
        id: "prod-5-alt",
        name: "Trash Can Liners 55gal",
        description: "80% recycled content",
        unitOfMeasure: "Each",
        unitPrice: "0.47",
        supplier: "EcoSupply Co",
        contract: "STATE-EDU-ABC",
        availability: "In Stock",
        isEco: true,
        category: "Cleaning Supplies",
        specifications: {}
      }
    ];

    sampleProducts.forEach(product => {
      this.products.set(product.id, product);
    });
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct, 
      id,
      description: insertProduct.description ?? null,
      contract: insertProduct.contract ?? null,
      availability: insertProduct.availability ?? "In Stock",
      isEco: insertProduct.isEco ?? null,
      category: insertProduct.category ?? null,
      specifications: insertProduct.specifications ?? null
    };
    this.products.set(id, product);
    return product;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = { 
      ...insertOrder, 
      id, 
      createdAt: new Date(),
      status: insertOrder.status ?? "processing",
      fileName: insertOrder.fileName ?? null,
      totalAmount: insertOrder.totalAmount ?? null,
      totalSavings: insertOrder.totalSavings ?? null,
      itemsData: insertOrder.itemsData ?? null
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, orderUpdate: Partial<Order>): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...orderUpdate };
    this.orders.set(id, updated);
    return updated;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = randomUUID();
    const orderItem: OrderItem = { 
      ...insertOrderItem, 
      id,
      confidence: insertOrderItem.confidence ?? null,
      isSwapped: insertOrderItem.isSwapped ?? null,
      originalProductId: insertOrderItem.originalProductId ?? null
    };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  async updateOrderItem(id: string, orderItemUpdate: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const existing = this.orderItems.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...orderItemUpdate };
    this.orderItems.set(id, updated);
    return updated;
  }

  async getSwapRecommendations(orderId: string): Promise<SwapRecommendation[]> {
    return Array.from(this.swapRecommendations.values()).filter(swap => swap.orderId === orderId);
  }

  async createSwapRecommendation(insertSwap: InsertSwapRecommendation): Promise<SwapRecommendation> {
    const id = randomUUID();
    const swap: SwapRecommendation = { 
      ...insertSwap, 
      id,
      savingsAmount: insertSwap.savingsAmount ?? null,
      reason: insertSwap.reason ?? null,
      isAccepted: insertSwap.isAccepted ?? null
    };
    this.swapRecommendations.set(id, swap);
    return swap;
  }

  async updateSwapRecommendation(id: string, swapUpdate: Partial<SwapRecommendation>): Promise<SwapRecommendation | undefined> {
    const existing = this.swapRecommendations.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...swapUpdate };
    this.swapRecommendations.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
