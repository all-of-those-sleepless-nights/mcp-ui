"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNestApplication = createNestApplication;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const express = require('express');
const app_module_1 = require("./app.module");
async function createNestApplication() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bodyParser: false });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const httpAdapter = app.getHttpAdapter();
    const instance = typeof httpAdapter?.getInstance === 'function' ? httpAdapter.getInstance() : undefined;
    if (instance && typeof instance.use === 'function') {
        const jsonParser = express.json();
        const urlencodedParser = express.urlencoded({ extended: true });
        instance.use((req, res, next) => {
            if (req.path === '/mcp/messages') {
                next();
                return;
            }
            jsonParser(req, res, (jsonErr) => {
                if (jsonErr) {
                    next(jsonErr);
                    return;
                }
                urlencodedParser(req, res, next);
            });
        });
    }
    return app;
}
//# sourceMappingURL=app-bootstrap.js.map