const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || '';

if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  console.log('[PRISMA] Cloud PostgreSQL detected. Adapting schema for Vercel/Neon...');
  schema = schema.replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');
  schema = schema.replace(/url\s*=\s*"file:\.\/dev\.db"/, 'url = env("DATABASE_URL")');
  fs.writeFileSync(schemaPath, schema);

  try {
    console.log('[PRISMA] Pushing schema to Cloud PostgreSQL...');
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl }
    });
    console.log('[PRISMA] Database schema push complete!');
  } catch (err) {
    console.warn('[PRISMA] Note: prisma db push warning or skipped:', err.message);
  }
} else {
  console.log('[PRISMA] Local environment detected. Ensuring SQLite schema...');
  schema = schema.replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');
  schema = schema.replace(/url\s*=\s*env\("DATABASE_URL"\)/, 'url = "file:./dev.db"');
  fs.writeFileSync(schemaPath, schema);
}

