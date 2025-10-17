import { PrismaClient, Role, Condition, OrderStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database for The Golf Exchange...');

  // --- USERS ---
  const seller = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'seller@golfexchange.com',
      password: 'hashedpassword123', // In production, hash this with bcrypt
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  const buyer = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'buyer@golfexchange.com',
      password: 'hashedpassword123',
      role: Role.USER,
      isVerified: true,
    },
  });

  // --- PRODUCTS ---
  const products = await prisma.product.createMany({
    data: [
      {
        title: 'Callaway Epic Driver',
        description: 'Top-tier performance driver for advanced golfers.',
        price: 75000,
        category: 'Drivers',
        condition: Condition.NEW,
        images: ['https://placehold.co/600x400?text=Callaway+Driver'],
        stock: 5,
        sellerId: seller.id,
        location: 'Lagos, Nigeria',
      },
      {
        title: 'Titleist Pro V1 Golf Balls (Pack of 12)',
        description: 'High-quality golf balls for distance and control.',
        price: 35000,
        category: 'Balls',
        condition: Condition.NEW,
        images: ['https://placehold.co/600x400?text=Titleist+Pro+V1'],
        stock: 15,
        sellerId: seller.id,
        location: 'Abuja, Nigeria',
      },
      {
        title: 'Used TaylorMade P790 Irons Set',
        description: 'Lightly used iron set in great condition.',
        price: 120000,
        category: 'Irons',
        condition: Condition.USED,
        images: ['https://placehold.co/600x400?text=TaylorMade+P790'],
        stock: 3,
        isUsed: true,
        sellerId: seller.id,
        location: 'Port Harcourt, Nigeria',
      },
    ],
  });

  const allProducts = await prisma.product.findMany();

  // --- CART ---
  const cart = await prisma.cart.create({
    data: {
      userId: buyer.id,
      items: {
        create: [
          {
            productId: allProducts[0].id,
            quantity: 1,
          },
          {
            productId: allProducts[1].id,
            quantity: 2,
          },
        ],
      },
    },
    include: { items: true },
  });

  // --- ORDER ---
  const order = await prisma.order.create({
    data: {
      buyerId: buyer.id,
      totalAmount: 145000,
      status: OrderStatus.PAID,
      items: {
        create: [
          {
            productId: allProducts[0].id,
            quantity: 1,
            price: 75000,
          },
          {
            productId: allProducts[1].id,
            quantity: 2,
            price: 35000,
          },
        ],
      },
    },
  });

  // --- TRANSACTION ---
  await prisma.transaction.create({
    data: {
      amount: 145000,
      currency: 'NGN',
      provider: 'paystack',
      providerRef: 'TXN-12345',
      status: 'SUCCESS',
      orderId: order.id,
    },
  });

  console.log('✅ Seed complete! Database initialized successfully.');
}

main()
  .catch((err) => {
    console.error('❌ Error seeding database:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
