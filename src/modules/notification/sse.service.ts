import { Injectable } from "@nestjs/common";
import { fromEvent, Subject } from "rxjs";
import { EventEmitter } from "events";

@Injectable()
export class SseService {
  private readonly emitter = new EventEmitter();
  private readonly subscriptions = new Map<string, Set<string>>();

  subscribe(channel: string) {
    return fromEvent(this.emitter, channel);
  }

  emit(channel: string, data?: object) {
    this.emitter.emit(channel, { data });
  }

  addSubscription(userId: string, channel: string) {
    let userSubs = this.subscriptions.get(userId);
    if (!userSubs) {
      userSubs = new Set();
      this.subscriptions.set(userId, userSubs);
    }
    userSubs.add(channel);
  }

  removeSubscription(userId: string, channel: string) {
    const userSubs = this.subscriptions.get(userId);
    if (userSubs) {
      userSubs.delete(channel);
      if (userSubs.size === 0) {
        this.subscriptions.delete(userId);
      }
    }
  }

  hasSubscription(userId: string): boolean {
    const userSubs = this.subscriptions.get(userId);
    return userSubs ? userSubs.size > 0 : false;
  }
}
