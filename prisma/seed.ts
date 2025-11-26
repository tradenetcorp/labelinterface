import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@mindco.mv";
  const adminPassword = process.env.ADMIN_PASSWORD || "email";

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

