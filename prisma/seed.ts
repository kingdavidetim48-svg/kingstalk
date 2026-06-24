import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const plans = [
    {
      id: "free",
      name: "Free",
      paystackPlanCode: "",
      price: 0,
      maxCustomVoices: 0,
      perGenerationCharacterLimit: 2000,
      monthlyCharacterLimit: 10000,
      premiumVoices: false,
      apiAccess: false,
      teamCollaboration: false,
    },
    {
      id: "starter",
      name: "Starter",
      paystackPlanCode: process.env.PAYSTACK_STARTER_PLAN_CODE ?? "",
      price: 900,
      maxCustomVoices: 1,
      perGenerationCharacterLimit: 3000,
      monthlyCharacterLimit: 100000,
      premiumVoices: false,
      apiAccess: false,
      teamCollaboration: false,
    },
    {
      id: "creator",
      name: "Creator",
      paystackPlanCode: process.env.PAYSTACK_CREATOR_PLAN_CODE ?? "",
      price: 1900,
      maxCustomVoices: 5,
      perGenerationCharacterLimit: 15000,
      monthlyCharacterLimit: 500000,
      premiumVoices: true,
      apiAccess: false,
      teamCollaboration: false,
    },
    {
      id: "pro",
      name: "Pro",
      paystackPlanCode: process.env.PAYSTACK_PRO_PLAN_CODE ?? "",
      price: 4900,
      maxCustomVoices: null,
      perGenerationCharacterLimit: 50000,
      monthlyCharacterLimit: 2000000,
      premiumVoices: true,
      apiAccess: true,
      teamCollaboration: true,
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
