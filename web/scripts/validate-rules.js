#!/usr/bin/env node

/**
 * Project Rules Validator
 * Checks code against project conventions defined in RULES.md
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const errors = [];
const warnings = [];

console.log('🔍 Validating project rules...\n');

// Rule 1: Check Prisma schema for proper mappings
function validatePrismaSchema() {
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

  if (!fs.existsSync(schemaPath)) {
    errors.push('Prisma schema not found at prisma/schema.prisma');
    return;
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');
  const lines = schema.split('\n');

  let inModel = false;
  let modelName = '';
  let hasTableMap = false;
  const fieldsWithoutMap = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect model start
    if (line.startsWith('model ')) {
      if (inModel && !hasTableMap) {
        errors.push(`Model ${modelName} missing @@map() for table name`);
      }

      inModel = true;
      modelName = line.split(' ')[1];
      hasTableMap = false;
      fieldsWithoutMap.length = 0;
    }

    // Check for @@map
    if (line.startsWith('@@map(')) {
      hasTableMap = true;

      // Verify table name is snake_case and plural
      const match = line.match(/@@map\("(\w+)"\)/);
      if (match) {
        const tableName = match[1];
        if (tableName !== tableName.toLowerCase()) {
          errors.push(`Table name "${tableName}" should be lowercase`);
        }
        // Check for camelCase (capital letter after lowercase)
        if (/[a-z][A-Z]/.test(tableName)) {
          errors.push(`Table name "${tableName}" should use snake_case (not camelCase)`);
        }
      }
    }

    // Check model fields for @map
    if (inModel && !line.startsWith('model') && !line.startsWith('@@') && !line.startsWith('}')) {
      const fieldMatch = line.match(/^\s*(\w+)\s+/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];

        // Skip special fields that don't need mapping
        if (['id', 'user', 'album', 'post', 'edge'].includes(fieldName)) {
          continue;
        }

        // Skip relation fields (they end with [] or have @relation)
        const isRelationField = line.includes('[]') || line.includes('@relation');
        if (isRelationField) {
          continue;
        }

        // Check if field has camelCase (needs mapping)
        const hasCamelCase = /[a-z][A-Z]/.test(fieldName);
        const hasMap = line.includes('@map(');

        if (hasCamelCase && !hasMap) {
          fieldsWithoutMap.push(fieldName);
        }
      }
    }

    // Detect model end
    if (line === '}' && inModel) {
      if (!hasTableMap) {
        errors.push(`Model ${modelName} missing @@map() for table name`);
      }
      if (fieldsWithoutMap.length > 0) {
        fieldsWithoutMap.forEach(field => {
          errors.push(`Field ${modelName}.${field} should have @map() to snake_case`);
        });
      }
      inModel = false;
    }
  }
}

// Rule 2: Check for banned dependencies
function validateDependencies() {
  const packagePath = path.join(__dirname, '../package.json');

  if (!fs.existsSync(packagePath)) {
    errors.push('package.json not found');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  const banned = ['spotify-web-api-node', 'next-auth', '@next-auth/prisma-adapter'];

  banned.forEach(dep => {
    if (allDeps[dep]) {
      errors.push(`Banned dependency found: ${dep}`);
    }
  });
}

// Rule 3: Check for direct Prisma usage in routes
function validateRouteFiles() {
  const routesDir = path.join(__dirname, '../src/app/api');

  if (!fs.existsSync(routesDir)) {
    warnings.push('API routes directory not found');
    return;
  }

  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    // Skip if it's importing services (that's okay)
    if (content.includes('from "@/lib/services/') || content.includes('from "@/lib/server-auth"')) {
      return;
    }

    // Check for direct Prisma queries in routes
    const hasPrismaFind = content.match(/prisma\.(user|album|rating|post)\.(find|create|update|delete)/);
    if (hasPrismaFind) {
      warnings.push(`${fileName}: Consider using service layer instead of direct Prisma access`);
    }
  }

  function walkDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file === 'route.ts' || file === 'route.tsx') {
        checkFile(filePath);
      }
    });
  }

  try {
    walkDir(routesDir);
  } catch {
    warnings.push(`Error walking routes directory`);
  }
}

// Rule 4: Check for proper auth usage
function validateAuthUsage() {
  const appDir = path.join(__dirname, '../src/app');

  if (!fs.existsSync(appDir)) {
    warnings.push('App directory not found');
    return;
  }

  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.relative(appDir, filePath);

    // Check for banned auth imports
    if (content.includes('from "next-auth"') || content.includes('getServerSession')) {
      errors.push(`${fileName}: Using banned NextAuth - use JWT auth instead`);
    }

    // Check for proper JWT auth
    if (content.includes('session?.user?.id')) {
      warnings.push(`${fileName}: Update to use getCurrentUser() instead of session`);
    }
  }

  function walkDir(dir) {
    try {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          walkDir(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          checkFile(filePath);
        }
      });
    } catch {
      // Silently skip directories we can't read
    }
  }

  walkDir(appDir);
}

// Run all validations
validatePrismaSchema();
validateDependencies();
validateRouteFiles();
validateAuthUsage();

// Report results
console.log('📋 Validation Results:\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All rules passed!\n');
  process.exit(0);
}

if (errors.length > 0) {
  console.log(`❌ ${errors.length} Error(s):\n`);
  errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err}`);
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} Warning(s):\n`);
  warnings.forEach((warn, i) => {
    console.log(`  ${i + 1}. ${warn}`);
  });
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ Validation failed. Please fix errors above.\n');
  process.exit(1);
} else {
  console.log('✅ No errors found (only warnings).\n');
  process.exit(0);
}
