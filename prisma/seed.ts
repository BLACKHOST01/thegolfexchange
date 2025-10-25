import { PrismaClient, Role, Condition, OrderStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database for The Golf Exchange...");

  // Clear existing data (optional - be careful in production)
  console.log("🧹 Clearing existing data...");
  await prisma.transaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // --- USERS ---
  console.log("👥 Creating users...");
  const seller = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "seller@golfexchange.com",
      password: "hashedpassword123",
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  const buyer = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "buyer@golfexchange.com",
      password: "hashedpassword123",
      role: Role.USER,
      isVerified: true,
      phone: "+1234567890",
    },
  });

  // --- CATEGORIES ---
  console.log("📂 Creating categories...");
  const categories = await Promise.all([
    prisma.category.create({
      data: { 
        name: "Drivers", 
        description: "High-performance golf drivers" 
      },
    }),
    prisma.category.create({
      data: { 
        name: "Irons", 
        description: "Precision-engineered golf irons" 
      },
    }),
    prisma.category.create({
      data: { 
        name: "Balls", 
        description: "Quality golf balls for all levels" 
      },
    }),
    prisma.category.create({
      data: { 
        name: "Accessories", 
        description: "Gloves, tees, and more" 
      },
    }),
  ]);

  // --- SUB-CATEGORIES ---
  console.log("📁 Creating subcategories...");
  const subcategories = await Promise.all([
    prisma.subcategory.create({
      data: {
        name: "Driver Heads",
        categoryId: categories[0].id,
      },
    }),
    prisma.subcategory.create({
      data: {
        name: "Complete Drivers",
        categoryId: categories[0].id,
      },
    }),
    prisma.subcategory.create({
      data: {
        name: "Iron Sets",
        categoryId: categories[1].id,
      },
    }),
  ]);

  // --- PRODUCTS ---
  console.log("🛒 Creating products...");
  const products = [];
  
  for (let i = 0; i < 20; i++) {
    const product = await prisma.product.create({
      data: {
        title: faker.commerce.productName() + " Golf Club",
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 50, max: 500 })),
        categoryId: faker.helpers.arrayElement(categories).id,
        subcategoryId: faker.helpers.arrayElement(subcategories).id,
        condition: faker.helpers.arrayElement([Condition.NEW, Condition.USED]),
        stock: faker.number.int({ min: 1, max: 20 }),
        isUsed: faker.datatype.boolean({ probability: 0.3 }),
        isFeatured: faker.datatype.boolean({ probability: 0.2 }),
        rating: parseFloat(faker.number.float({ min: 3, max: 5, fractionDigits: 1 }).toFixed(1)),
        sellerId: seller.id,
        location: `${faker.location.city()}, ${faker.location.state()}`,
      },
    });
    products.push(product);
  }

  // Create product images
  console.log("🖼️ Creating product images...");
  for (const product of products) {
    await prisma.uploadedFile.create({
      data: {
        name: `product-${product.id}-image.jpg`,
        mimeType: 'image/jpeg',
        data: Buffer.from('fake-image-data'), // In real scenario, this would be actual image data
        productId: product.id,
      },
    });
  }

  // --- REVIEWS ---
  console.log("💬 Creating reviews...");
  for (const product of products) {
    const reviewCount = faker.number.int({ min: 0, max: 3 });
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

  // --- ORDERS ---
  console.log("🧾 Creating orders...");
  const orders = [];
  
  for (let i = 0; i < 8; i++) {
    const items = faker.helpers.arrayElements(products, faker.number.int({ min: 1, max: 3 }));
    let totalAmount = 0;
    
    const orderItems = items.map(product => {
      const quantity = faker.number.int({ min: 1, max: 2 });
      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;
      
      return {
        productId: product.id,
        quantity: quantity,
        price: product.price,
      };
    });

    const order = await prisma.order.create({
      data: {
        buyerId: buyer.id,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        status: faker.helpers.arrayElement([
          OrderStatus.PENDING,
          OrderStatus.PAID,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
          OrderStatus.CANCELLED,
        ]),
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // Create transaction for paid, shipped, or delivered orders
    if (order.status !== 'PENDING' && order.status !== 'CANCELLED') {
      await prisma.transaction.create({
        data: {
          amount: order.totalAmount,
          currency: "USD",
          provider: faker.helpers.arrayElement(["paystack", "stripe", "paypal"]),
          providerRef: `TXN-${faker.string.alphanumeric(8).toUpperCase()}`,
          status: "SUCCESS",
          orderId: order.id,
        },
      });
    }

    orders.push(order);
    console.log(`✅ Created order ${i + 1} with status: ${order.status}`);
  }

  // --- CART ---
  console.log("🛒 Creating cart...");
  await prisma.cart.create({
    data: {
      userId: buyer.id,
      items: {
        create: [
          { productId: products[0].id, quantity: 1 },
          { productId: products[1].id, quantity: 2 },
        ],
      },
    },
  });

  console.log("🎉 Seed completed successfully!");
  console.log(`📊 Summary:
    - Users: 2
    - Categories: ${categories.length}
    - Subcategories: ${subcategories.length}
    - Products: ${products.length}
    - Orders: ${orders.length}
    - Reviews: ${await prisma.review.count()}
  `);
}

main()
  .catch((err) => {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });