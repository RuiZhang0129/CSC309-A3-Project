'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const saltRounds = 10; // Recommended bcrypt salt rounds

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.error("Usage: node createsu.js UTORID EMAIL PASSWORD");
        process.exit(1);
    }

    const [utorid, email, rawPassword] = args;

    try {
        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

        // Upsert means "create it if it doesn't exist; otherwise update it."
        const user = await prisma.user.upsert({
            where: { utorid },
            update: {
                email,
                password: hashedPassword, // Store hashed password
                role: 'superuser',
                verified: true,
            },
            create: {
                utorid,
                email,
                password: hashedPassword, // Store hashed password
                username: `superuser_${utorid}`,
                name: `Superuser ${utorid}`,
                role: 'superuser',
                verified: true,
            },
        });

        console.log("✅ Superuser created/updated successfully:");
        console.log(user);
    } catch (err) {
        console.error("❌ Error creating superuser:", err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
