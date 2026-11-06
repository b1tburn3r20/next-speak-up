// Sets up the permission catalog on its own, for a database that isn't using the local seed.
import { PrismaClient } from "@prisma/client";
import { ensureRbac } from "./rbac";

const prisma = new PrismaClient();
ensureRbac(prisma)
  .then(() => console.log("Permissions are ready."))
  .finally(() => prisma.$disconnect());
