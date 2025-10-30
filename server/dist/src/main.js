"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_bootstrap_1 = require("./app-bootstrap");
async function bootstrap() {
    const app = await (0, app_bootstrap_1.createNestApplication)();
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map