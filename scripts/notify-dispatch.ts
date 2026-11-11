// One pass of the notification sender, from the command line: `npm run notify:dispatch`. Local database
// only, like every script here. Sends real notifications to whoever has subscribed on this database.
import { runDispatch } from "@/lib/notifications/dispatch";
import { pushConfigured } from "@/lib/notifications/web-push";
import prisma from "@/prisma/client";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/@(127\.0\.0\.1|localhost)[:/]/.test(url)) {
    console.error("Refusing to run: DATABASE_URL isn't the local database.");
    process.exit(1);
  }
  if (!pushConfigured()) {
    console.error("Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env first (npx web-push generate-vapid-keys).");
    process.exit(1);
  }
  const counts = await runDispatch();
  console.log(JSON.stringify(counts, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
