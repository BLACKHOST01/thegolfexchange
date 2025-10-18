import { PrismaClient, Role, Condition, OrderStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database for The Golf Exchange...");

  // --- USERS ---
  const seller = await prisma.user.upsert({
    where: { email: "seller@golfexchange.com" },
    update: {},
    create: {
      name: "John Doe",
      email: "seller@golfexchange.com",
      password: "hashedpassword123",
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@golfexchange.com" },
    update: {},
    create: {
      name: "Jane Smith",
      email: "buyer@golfexchange.com",
      password: "hashedpassword123",
      role: Role.USER,
      isVerified: true,
    },
  });

  // --- CATEGORIES ---
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Drivers" },
      update: {},
      create: { name: "Drivers", description: "High-performance golf drivers" },
    }),
    prisma.category.upsert({
      where: { name: "Irons" },
      update: {},
      create: { name: "Irons", description: "Precision-engineered golf irons" },
    }),
    prisma.category.upsert({
      where: { name: "Balls" },
      update: {},
      create: { name: "Balls", description: "Quality golf balls for all levels" },
    }),
    prisma.category.upsert({
      where: { name: "Accessories" },
      update: {},
      create: { name: "Accessories", description: "Gloves, tees, and more" },
    }),
  ]);

  // --- PRODUCTS ---
  const productCount = await prisma.product.count();
  if (productCount === 0) {
    const allProducts = Array.from({ length: 50 }).map(() => ({
      title: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 15000, max: 250000 })),
      categoryId: faker.helpers.arrayElement(categories).id,
      condition: faker.helpers.arrayElement([Condition.NEW, Condition.USED]),
      images: [
        faker.image.urlPicsumPhotos({ width: 600, height: 400, blur: 2 }),
      ],
      stock: faker.number.int({ min: 1, max: 20 }),
      isUsed: faker.datatype.boolean(),
      isFeatured: faker.datatype.boolean(),
      rating: parseFloat(
        faker.number.float({ min: 3, max: 5, fractionDigits: 1 }).toFixed(1)
      ),
      sellerId: seller.id,
      location: `${faker.location.city()}, UNITED STATES`,
    }));

    await prisma.product.createMany({ data: allProducts });
    console.log(`🛒 Seeded ${allProducts.length} random products.`);
  }

  const allProducts = await prisma.product.findMany();

  // --- REVIEWS ---
  console.log("💬 Adding random reviews...");
  for (const product of allProducts) {
    const reviewCount = faker.number.int({ min: 1, max: 5 });
    for (let i = 0; i < reviewCount; i++) {
      await prisma.review.create({
        data: {
          rating: faker.number.int({ min: 3, max: 5 }),
          comment: faker.lorem.sentence(),
          productId: product.id,
          userId: buyer.id,
        },
      });
    }
  }

  // --- CART ---
  const cart = await prisma.cart.upsert({
    where: { userId: buyer.id },
    update: {},
    create: {
      userId: buyer.id,
      items: {
        create: [
          { productId: allProducts[0].id, quantity: 1 },
          { productId: allProducts[1].id, quantity: 2 },
        ],
      },
    },
    include: { items: true },
  });

  // --- ORDERS ---
  console.log("🧾 Creating sample orders...");
  const orders = await Promise.all(
    Array.from({ length: 3 }).map(async (_, i) => {
      const items = faker.helpers.arrayElements(allProducts, 2);
      const totalAmount = items.reduce(
        (sum, p) => sum + p.price * faker.number.int({ min: 1, max: 3 }),
        0
      );

      const order = await prisma.order.create({
        data: {
          buyerId: buyer.id,
          totalAmount,
          status: faker.helpers.arrayElement([
            OrderStatus.PAID,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
          ]),
          items: {
            create: items.map((p) => ({
              productId: p.id,
              quantity: faker.number.int({ min: 1, max: 3 }),
              price: p.price,
            })),
          },
        },
        include: { items: true },
      });

      // --- TRANSACTION per order ---
      await prisma.transaction.create({
        data: {
          amount: order.totalAmount,
          currency: "USD",
          provider: "paystack",
          providerRef: `TXN-${faker.string.alphanumeric(6).toUpperCase()}`,
          status: "SUCCESS",
          orderId: order.id,
        },
      });

      return order;
    })
  );

  console.log(`✅ Seed complete! Added ${orders.length} orders, reviews, and transactions.`);
}

main()
  .catch((err) => {
    console.error("❌ Error seeding database:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
