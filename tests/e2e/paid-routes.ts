// These routes call paid services. No test may ever reach them.
export const PAID_ROUTES = /\/api\/(civic\/bills\/(ask|listen)|send-email)/;
