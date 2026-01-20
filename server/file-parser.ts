import * as XLSX from 'xlsx';

interface ParsedItem {
  name: string;
  quantity: number;
  unitOfMeasure?: string;
  description?: string;
  estimatedPrice?: string;
}

interface ParsedFileResult {
  items: ParsedItem[];
  fileName: string;
  rowCount: number;
}

export function parseCSV(csvContent: string, fileName: string): ParsedFileResult {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) {
    return { items: [], fileName, rowCount: 0 };
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
  
  const nameIndex = findColumnIndex(headers, ['name', 'item', 'product', 'description', 'item name', 'product name']);
  const qtyIndex = findColumnIndex(headers, ['quantity', 'qty', 'amount', 'count', 'units']);
  const uomIndex = findColumnIndex(headers, ['unit', 'uom', 'unit of measure', 'measure']);
  const priceIndex = findColumnIndex(headers, ['price', 'unit price', 'cost', 'amount', 'estimated price']);
  const descIndex = findColumnIndex(headers, ['description', 'desc', 'details', 'notes']);

  const items: ParsedItem[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every(v => !v.trim())) continue;

    const name = nameIndex >= 0 ? values[nameIndex]?.trim() : values[0]?.trim();
    const quantity = qtyIndex >= 0 ? parseInt(values[qtyIndex]) || 1 : 1;
    
    if (name) {
      items.push({
        name,
        quantity,
        unitOfMeasure: uomIndex >= 0 ? values[uomIndex]?.trim() : undefined,
        description: descIndex >= 0 ? values[descIndex]?.trim() : undefined,
        estimatedPrice: priceIndex >= 0 ? values[priceIndex]?.trim() : undefined
      });
    }
  }

  return { items, fileName, rowCount: items.length };
}

export function parseExcel(buffer: Buffer, fileName: string): ParsedFileResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1 });
  
  if (data.length === 0) {
    return { items: [], fileName, rowCount: 0 };
  }

  const headerRow = (data[0] as any[]).map(h => String(h || '').toLowerCase().trim());
  
  const nameIndex = findColumnIndex(headerRow, ['name', 'item', 'product', 'description', 'item name', 'product name']);
  const qtyIndex = findColumnIndex(headerRow, ['quantity', 'qty', 'amount', 'count', 'units']);
  const uomIndex = findColumnIndex(headerRow, ['unit', 'uom', 'unit of measure', 'measure']);
  const priceIndex = findColumnIndex(headerRow, ['price', 'unit price', 'cost', 'amount', 'estimated price']);
  const descIndex = findColumnIndex(headerRow, ['description', 'desc', 'details', 'notes']);

  const items: ParsedItem[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any[];
    if (!row || row.length === 0 || row.every(v => !v)) continue;

    const name = nameIndex >= 0 ? String(row[nameIndex] || '').trim() : String(row[0] || '').trim();
    const quantity = qtyIndex >= 0 ? parseInt(String(row[qtyIndex])) || 1 : 1;
    
    if (name) {
      items.push({
        name,
        quantity,
        unitOfMeasure: uomIndex >= 0 ? String(row[uomIndex] || '').trim() : undefined,
        description: descIndex >= 0 ? String(row[descIndex] || '').trim() : undefined,
        estimatedPrice: priceIndex >= 0 ? String(row[priceIndex] || '').trim() : undefined
      });
    }
  }

  return { items, fileName, rowCount: items.length };
}

function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name));
    if (index >= 0) return index;
  }
  return -1;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function matchItemsToProducts(items: ParsedItem[], products: any[]): any[] {
  return items.map(item => {
    const itemNameLower = item.name.toLowerCase();
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const product of products) {
      const productNameLower = product.name.toLowerCase();
      const score = calculateMatchScore(itemNameLower, productNameLower);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = product;
      }
    }
    
    const confidence = Math.min(0.99, 0.7 + (bestScore * 0.3));
    
    return {
      requestedItem: item,
      matchedProduct: bestMatch,
      confidence: confidence.toFixed(2),
      quantity: item.quantity
    };
  });
}

function calculateMatchScore(searchTerm: string, productName: string): number {
  const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 2);
  const productWords = productName.split(/\s+/).filter(w => w.length > 2);
  
  if (searchWords.length === 0) return 0;
  
  let matchedWords = 0;
  for (const word of searchWords) {
    if (productWords.some(pw => pw.includes(word) || word.includes(pw))) {
      matchedWords++;
    }
  }
  
  return matchedWords / searchWords.length;
}
