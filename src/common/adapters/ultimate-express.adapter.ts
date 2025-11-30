import { ExpressAdapter } from "@nestjs/platform-express";

// Unused custom adapter, kept for future reference
export class UltimateExpressAdapter extends ExpressAdapter {
  constructor(instance) {
    super(instance);
  }

  initHttpServer(options) {
    super.initHttpServer(options);
    this.httpServer = this.getInstance();
  }
}
