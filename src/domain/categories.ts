import fs from 'fs';
import yaml from 'yaml';
import path from 'path';
import { Logger } from '../infrastructure/logger.js';

export interface CategoryDefinition {
  name: string;
  description: string;
}

const yamlPath = path.resolve(process.cwd(), 'categories.yaml');
let categoriesList: CategoryDefinition[] = [];

try {
  const yamlContent = fs.readFileSync(yamlPath, 'utf8');
  const parsed = yaml.parse(yamlContent);
  categoriesList = parsed?.categories || [];
} catch (error) {
  Logger.error('Config', `Failed to load categories from ${yamlPath}:`, error);
}

export const CATEGORY_DEFINITIONS: readonly CategoryDefinition[] = Object.freeze(categoriesList);
export const CATEGORY_NAMES: readonly string[] = Object.freeze(CATEGORY_DEFINITIONS.map(c => c.name));

if (CATEGORY_NAMES.length === 0) {
  Logger.warn('Config', 'No categories defined in categories.yaml');
}
