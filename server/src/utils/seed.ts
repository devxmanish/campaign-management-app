import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Create Super Admin
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: config.superAdmin.email },
    });

    if (!existingSuperAdmin) {
      const passwordHash = await bcrypt.hash(config.superAdmin.password, 12);
      
      const superAdmin = await prisma.user.create({
        data: {
          name: config.superAdmin.name,
          email: config.superAdmin.email,
          passwordHash,
          role: UserRole.SUPER_ADMIN,
        },
      });

      console.log(`✅ Super Admin created: ${superAdmin.email}`);
    } else {
      console.log(`ℹ️ Super Admin already exists: ${existingSuperAdmin.email}`);
    }

    // Create sample Admin
    const adminEmail = 'admin@example.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('AdminPass123!', 12);
      
      const admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          passwordHash,
          role: UserRole.ADMIN,
        },
      });

      console.log(`✅ Admin created: ${admin.email}`);
    }

    // Create sample Campaign Creator
    const creatorEmail = 'creator@example.com';
    const existingCreator = await prisma.user.findUnique({
      where: { email: creatorEmail },
    });

    if (!existingCreator) {
      const passwordHash = await bcrypt.hash('CreatorPass123!', 12);
      
      const creator = await prisma.user.create({
        data: {
          name: 'Campaign Creator',
          email: creatorEmail,
          passwordHash,
          role: UserRole.CAMPAIGN_CREATOR,
        },
      });

      console.log(`✅ Campaign Creator created: ${creator.email}`);
    }

    // Create sample Campaign Manager
    const managerEmail = 'manager@example.com';
    const existingManager = await prisma.user.findUnique({
      where: { email: managerEmail },
    });

    if (!existingManager) {
      const passwordHash = await bcrypt.hash('ManagerPass123!', 12);
      
      const manager = await prisma.user.create({
        data: {
          name: 'Campaign Manager',
          email: managerEmail,
          passwordHash,
          role: UserRole.CAMPAIGN_MANAGER,
        },
      });

      console.log(`✅ Campaign Manager created: ${manager.email}`);
    }

    console.log('✅ Database seed completed!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
