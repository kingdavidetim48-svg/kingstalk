import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const plans = [
    {
      id: "starter",
      name: "Starter",
      paystackPlanCode: process.env.PAYSTACK_STARTER_PLAN_CODE ?? "",
      price: 900,
      maxCustomVoices: 1,
      maxGenerationLength: 3000,
      premiumVoices: false,
    },
    {
      id: "creator",
      name: "Creator",
      paystackPlanCode: process.env.PAYSTACK_CREATOR_PLAN_CODE ?? "",
      price: 1900,
      maxCustomVoices: 5,
      maxGenerationLength: 15000,
      premiumVoices: true,
    },
    {
      id: "pro",
      name: "Pro",
      paystackPlanCode: process.env.PAYSTACK_PRO_PLAN_CODE ?? "",
      price: 4900,
      maxCustomVoices: null,
      maxGenerationLength: 50000,
      premiumVoices: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
    console.log(`  ✓ ${plan.name} ($ ${plan.price / 100}/mo)`);
  }

  console.log("\nPlans seeded successfully.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
