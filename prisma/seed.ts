import { PrismaClient, Role, Condition, OrderStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database for The Golf Exchange...");

  // Clear existing data in correct order to respect foreign key constraints
  console.log("🧹 Clearing existing data...");
  
  // Delete in correct order (child tables first, then parent tables)
  await prisma.note.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.shippingAddress.deleteMany(); // Add this
  await prisma.guestCustomer.deleteMany(); // Add this
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany(); // Add this
  await prisma.address.deleteMany(); // Add this
  await prisma.review.deleteMany();
  await prisma.message.deleteMany(); // Add this
  await prisma.uploadedFile.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // --- USERS ---
  console.log("👥 Creating users...");

  // Create multiple specific users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "John Doe",
        email: "seller@golfexchange.com",
        password: "hashedpassword123",
        role: Role.ADMIN,
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Jane Smith",
        email: "buyer@golfexchange.com",
        password: "hashedpassword123",
        role: Role.USER,
        isVerified: true,
        phone: "+1234567890",
      },
    }),
    prisma.user.create({
      data: {
        name: "Mike Johnson",
        email: "mike.johnson@example.com",
        password: "hashedpassword123",
        role: Role.USER,
        isVerified: true,
        phone: "+1234567891",
      },
    }),
    prisma.user.create({
      data: {
        name: "Sarah Wilson",
        email: "sarah.wilson@example.com",
        password: "hashedpassword123",
        role: Role.USER,
        isVerified: true,
        phone: "+1234567892",
      },
    }),
    prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@golfexchange.com",
        password: "hashedpassword123",
        role: Role.ADMIN,
        isVerified: true,
        phone: "+1234567893",
      },
    }),
  ]);

  const [seller, buyer, mike, sarah, admin] = users;

  // Create some addresses for users
  console.log("🏠 Creating user addresses...");
  for (const user of users) {
    await prisma.address.create({
      data: {
        title: "Home",
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        postalCode: faker.location.zipCode(),
        phone: user.phone || faker.phone.number(),
        isDefault: true,
        userId: user.id,
      },
    });
  }

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
        data: Buffer.from('fake-image-data'),
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
          userId: faker.helpers.arrayElement([buyer.id, mike.id, sarah.id]),
        },
      });
    }
  }

  // --- WISHLIST ITEMS ---
  console.log("❤️ Creating wishlist items...");
  for (const user of [buyer, mike, sarah]) {
    const wishlistItems = faker.helpers.arrayElements(products, faker.number.int({ min: 1, max: 4 }));
    for (const product of wishlistItems) {
      await prisma.wishlistItem.create({
        data: {
          userId: user.id,
          productId: product.id,
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

    // Generate unique order number
    const orderNumber = `GX-${Date.now()}-${faker.string.numeric(4)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber,
        buyerId: faker.helpers.arrayElement([buyer.id, mike.id, sarah.id]),
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

    // Create shipping address for the order
    await prisma.shippingAddress.create({
      data: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        postalCode: faker.location.zipCode(),
        orderId: order.id,
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
          userId: order.buyerId,
        },
      });
    }

    // Create some notes for orders (optional)
    if (faker.datatype.boolean({ probability: 0.3 })) {
      await prisma.note.create({
        data: {
          content: faker.lorem.sentence(),
          orderId: order.id,
          authorId: faker.helpers.arrayElement([admin.id, seller.id]),
        },
      });
    }

    orders.push(order);
    console.log(`✅ Created order ${orderNumber} with status: ${order.status}`);
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

  // --- MESSAGES ---
  console.log("💌 Creating messages...");
  await prisma.message.create({
    data: {
      content: "Hello, I'm interested in this product. Is it still available?",
      senderId: buyer.id,
      receiverId: seller.id,
    },
  });

  console.log("🎉 Seed completed successfully!");
  console.log(`📊 Summary:
    - Users: ${users.length}
    - Categories: ${categories.length}
    - Subcategories: ${subcategories.length}
    - Products: ${products.length}
    - Orders: ${orders.length}
    - Reviews: ${await prisma.review.count()}
    - Addresses: ${await prisma.address.count()}
    - Wishlist Items: ${await prisma.wishlistItem.count()}
    - Notes: ${await prisma.note.count()}
    - Messages: ${await prisma.message.count()}
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