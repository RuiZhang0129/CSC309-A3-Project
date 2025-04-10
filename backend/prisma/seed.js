const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log("🧹 Clearing old data...");

    // Clear in foreign key dependency order
    await prisma.promotionTransaction.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.eventParticipants.deleteMany();
    await prisma.event.deleteMany();
    await prisma.promotion.deleteMany();
    await prisma.user.deleteMany();

    console.log("👤 Creating users...");
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const roles = [
        'regular', 'regular', 'regular', 'regular', 'regular',
        'regular', 'regular', 'cashier', 'manager', 'superuser'
    ];

    const users = [];

    for (let i = 0; i < 10; i++) {
        const user = await prisma.user.create({
            data: {
                utorid: `user${i}`,
                name: `User ${i}`,
                email: `user${i}@mail.utoronto.ca`,
                password: hashedPassword,
                role: roles[i],
                birthday: new Date(`199${i}-01-01`),
                createdAt: new Date(),
            }
        });
        users.push(user);
    }

    console.log("💰 Creating transactions...");
    const transactionTypes = ['purchase', 'redemption', 'transfer', 'event', 'adjustment'];

    for (let i = 0; i < 30; i++) {
        const type = transactionTypes[i % transactionTypes.length];
        const user = users[i % users.length];

        await prisma.transaction.create({
            data: {
                userId: user.id,
                type,
                amount: 10 + (i % 5),
                remark: `Seed ${type} ${i}`,
                createdAt: new Date(Date.now() - i * 1000000),
            }
        });
    }

    console.log("🎫 Creating events...");
    for (let i = 0; i < 5; i++) {
        await prisma.event.create({
            data: {
                name: `Event ${i}`,
                description: `This is the description for event ${i}`,
                location: `Location ${i}`,
                startTime: new Date(Date.now() + i * 86400000),
                endTime: new Date(Date.now() + (i + 1) * 86400000),
                capacity: 50,
                pointsRemain: 100,
                published: true,
                organizerId: users[9].id // superuser
            }
        });
    }

    console.log("🎁 Creating promotions...");
    for (let i = 0; i < 5; i++) {
        await prisma.promotion.create({
            data: {
                name: `Promotion ${i}`,
                description: `This is promotion ${i}`,
                type: i % 2 === 0 ? 'automatic' : 'one-time',
                minSpending: 50 + i * 10,
                rate: i % 2 === 0 ? 1.5 : null,
                points: i % 2 === 1 ? 10 + i : 0,
                endTime: new Date(Date.now() + i * 86400000),
                createdAt: new Date()
            }
        });
    }

    console.log("✅ Seed data imported successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Error occurred:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
