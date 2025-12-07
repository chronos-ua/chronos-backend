import { Injectable, OnModuleInit } from "@nestjs/common";
import { Model } from "mongoose";
import * as webpush from "web-push";
import { User } from "../users/schemas/user.schema";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class PushNotificationService implements OnModuleInit {
  constructor(@InjectModel("User") private userModel: Model<User>) {}
  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY || "";
    const privateKey = process.env.VAPID_PRIVATE_KEY || "";

    if (publicKey && privateKey) {
      webpush.setVapidDetails(
        `mailto:admin@${(process.env.BASE_URL || "example.com").replace(/^https?:\/\//, "")}`,
        publicKey,
        privateKey
      );
    }
  }

  async sendNotification(subscription: any, payload: any): Promise<boolean> {
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      return true;
    } catch (error: any) {
      if (error.statusCode === 410) {
        // Expired
        await this.userModel.updateMany(
          { "pushSubscriptions.endpoint": subscription.endpoint },
          { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } }
        );
        return false;
      }
      throw error;
    }
  }

  async sendToMultipleSubscriptions(
    subscriptions: any[],
    payload: any
  ): Promise<{ succeeded: number; failed: string[] }> {
    const results = await Promise.allSettled(
      subscriptions.map((sub) => this.sendNotification(sub, payload))
    );

    const failed: string[] = [];
    let succeeded = 0;

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        succeeded++;
      } else {
        failed.push(subscriptions[index].endpoint);
      }
    });

    return { succeeded, failed };
  }
}
