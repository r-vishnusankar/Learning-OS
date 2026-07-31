import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { departments } from "./schema";

config({ path: ".env.local" });

const departmentSeed = [
  {
    id: "qa" as const,
    name: "Quality Assurance",
    description: "Testing, automation, and quality engineering",
    employeeCount: 42,
    courseCount: 28,
    avgCompletion: 72,
    color: "#0D9488",
    icon: "Bug",
  },
  {
    id: "development" as const,
    name: "Development",
    description: "Full-stack engineering and software craftsmanship",
    employeeCount: 128,
    courseCount: 64,
    avgCompletion: 68,
    color: "#0284C7",
    icon: "Code2",
  },
  {
    id: "ba" as const,
    name: "Business Analyst",
    description: "Requirements, process modeling, and stakeholder alignment",
    employeeCount: 36,
    courseCount: 22,
    avgCompletion: 75,
    color: "#CA8A04",
    icon: "Briefcase",
  },
  {
    id: "hr" as const,
    name: "Human Resources",
    description: "People ops, talent, and organizational development",
    employeeCount: 24,
    courseCount: 18,
    avgCompletion: 81,
    color: "#DB2777",
    icon: "Users",
  },
  {
    id: "marketing" as const,
    name: "Digital Marketing",
    description: "Growth, content, SEO, and campaign analytics",
    employeeCount: 31,
    courseCount: 26,
    avgCompletion: 70,
    color: "#EA580C",
    icon: "Megaphone",
  },
  {
    id: "uiux" as const,
    name: "UI/UX Design",
    description: "Product design, research, and design systems",
    employeeCount: 28,
    courseCount: 24,
    avgCompletion: 74,
    color: "#7C3AED",
    icon: "Palette",
  },
  {
    id: "devops" as const,
    name: "DevOps",
    description: "CI/CD, infrastructure as code, and reliability",
    employeeCount: 38,
    courseCount: 30,
    avgCompletion: 66,
    color: "#059669",
    icon: "Workflow",
  },
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = drizzle(neon(databaseUrl));

  for (const department of departmentSeed) {
    await db
      .insert(departments)
      .values(department)
      .onConflictDoNothing({ target: departments.id });
  }

  console.log("Seeded departments");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
