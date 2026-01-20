import { db } from "./db";
import { products } from "@shared/schema";

const sampleProducts = [
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

async function seed() {
  console.log("Seeding database...");
  
  // Check if products already exist
  const existingProducts = await db.select().from(products);
  
  if (existingProducts.length > 0) {
    console.log(`Database already has ${existingProducts.length} products. Skipping seed.`);
    return;
  }
  
  // Insert products
  for (const product of sampleProducts) {
    await db.insert(products).values(product);
    console.log(`Inserted: ${product.name} (${product.id})`);
  }
  
  console.log("Seeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
