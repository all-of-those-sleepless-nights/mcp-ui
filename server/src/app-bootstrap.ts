import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NextFunction, Request, Response } from 'express';

// Lazily require express to avoid ESM interop issues when compiled to CommonJS.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');

import { AppModule } from './app.module';

export async function createNestApplication(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const httpAdapter = app.getHttpAdapter();
  const instance = typeof httpAdapter?.getInstance === 'function' ? httpAdapter.getInstance() : undefined;

  if (instance && typeof instance.use === 'function') {
    const jsonParser = express.json();
    const urlencodedParser = express.urlencoded({ extended: true });

    instance.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path === '/mcp/messages') {
        next();
        return;
      }

      jsonParser(req, res, (jsonErr?: unknown) => {
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
