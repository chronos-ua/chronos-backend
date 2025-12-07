import { SseService } from "./sse.service";
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  Sse
} from "@nestjs/common";
import { AllowAnonymous, Session } from "@thallesp/nestjs-better-auth";
import { type Request } from "express";
import type { IUserSession } from "../auth/auth.interfaces";
import { NotificationService } from "./notification.service";
import { Observable } from "rxjs";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../users/schemas/user.schema";
import { DevOnly } from "src/common/decorators/devOnly.decorator";

// TODO: geocoding
// https://developers.google.com/maps/documentation/geocoding/overview
@Controller("notifications")
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly sseService: SseService,
    @InjectModel("User") private userModel: Model<User>
  ) {}

  @Sse("subscribe")
  subscribe(
    @Session() session: IUserSession,
    @Req() req: Request
  ): Observable<any> {
    const userId = session.user.id;
    const channel = `user:${userId}`;

    this.sseService.addSubscription(userId, channel);

    req.on("close", () => {
      this.sseService.removeSubscription(userId, channel);
    });

    return this.sseService.subscribe(channel);
  }

  @Post("push/subscribe")
  async subscribeToPush(
    @Session() session: IUserSession,
    @Body() subscription: any
  ) {
    await this.userModel.findByIdAndUpdate(session.user.id, {
      $addToSet: { pushSubscriptions: subscription }
    });
    return { success: true };
  }

  @Delete("push/unsubscribe")
  async unsubscribeFromPush(
    @Session() session: IUserSession,
    @Body() body: { endpoint: string }
  ) {
    await this.userModel.findByIdAndUpdate(session.user.id, {
      $pull: { pushSubscriptions: { endpoint: body.endpoint } }
    });
    return { success: true };
  }

  @Get("vapid-public-key")
  @DevOnly(AllowAnonymous)
  @AllowAnonymous()
  getVapidPublicKey() {
    // annoying...
    const key = process.env.VAPID_PUBLIC_KEY || "";
    const cleanKey = key.trim().replace(/=+$/, "");
    return { publicKey: cleanKey };
  }

  @Post("test/send")
  async sendTestNotification(@Session() session: IUserSession) {
    await this.notificationService.sendNotification(session.user.id, {
      title: "Test Notification",
      message: "This is a test notification from Chronos!",
      url: "http://localhost:3000/test-push.html"
    });
    return { success: true, message: "Notification sent" };
  }
}
