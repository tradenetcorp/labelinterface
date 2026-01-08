import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const isProduction = process.env.NODE_ENV === "production";

  const adminEmail = process.env.ADMIN_EMAIL || (isProduction ? "" : "admin@mindco.mv");
  const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? "" : "email");

  if (isProduction && (!adminEmail || !adminPassword)) {
    throw new Error(
      "Refusing to seed an admin user in production without ADMIN_EMAIL and ADMIN_PASSWORD set."
    );
  }

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  if (existingAdmin) {
    // Update existing admin with password if it doesn't have one
    if (!existingAdmin.password) {
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
        },
      });
      console.log(`Updated admin user password: ${adminEmail}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }
    // Still seed labels even if admin exists
    await seedDefaultLabels();
    return;
  }

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin User",
      password: hashedPassword,
      role: "admin",
      active: true,
    },
  });

  console.log(`Created admin user: ${admin.email}`);

  // Seed default labels
  await seedDefaultLabels();
}

async function seedDefaultLabels() {
  const defaultLabels = [
    { name: "Male", shortcut: "m", active: true },
    { name: "Female", shortcut: "f", active: true },
    { name: "Dhivehi", shortcut: "d", active: true },
    { name: "English", shortcut: "e", active: true },
    { name: "analyst", shortcut: null, active: true },
    { name: "other", shortcut: null, active: true },
  ];

  for (const label of defaultLabels) {
    await prisma.label.upsert({
      where: { name: label.name },
      update: {},
      create: label,
    });
  }

  console.log(`Seeded ${defaultLabels.length} default labels`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
