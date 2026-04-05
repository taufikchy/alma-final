-- SQL untuk membuat Super Admin pertama
-- Run ini di PostgreSQL (via Supabase Dashboard atau psql)

-- Password: AdminAlma123!
-- Hash bcrypt dengan cost factor 12

INSERT INTO "User" (id, username, password, role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin_alma',
  '$2b$12$Obtf9KrB927sa2HA.hH75uNjW0/bMD8YSj72Ekhmh5qvdbIyB0NZG',
  'SUPER_ADMIN',
  NOW(),
  NOW()
);

-- Verifikasi
SELECT id, username, role, "createdAt" FROM "User" WHERE role = 'SUPER_ADMIN';