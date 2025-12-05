import { Injectable, Logger } from "@nestjs/common";
import {
  Behavior,
  GoogleGenAI,
  Schema,
  Type,
  type FunctionDeclaration
} from "@google/genai";
import { EEventType } from "src/modules/events/schemas/event.schema";
import { IUserSession } from "src/modules/auth/auth.interfaces";
import { CalendarService } from "src/modules/calendar/calendar.service";
import { EventService } from "src/modules/events/event.service";
@Injectable()
export class AIService {
  private readonly genAI: GoogleGenAI;
  private readonly token = process.env.GEMINI_API_KEY || "";
  private readonly maxOutputTokens = 690; // 69 is too low, 420 probably as well, 80085 is too high \(o_o)/
  private readonly aiUserId: string = process.env.AI_USER_ID || "ai-bot";
  private readonly isAllowedDestroyHumanity: boolean =
    process.env.ALLOW_DESTROY_HUMANITY === "true";

  private readonly logger = new Logger(AIService.name);
  constructor(
    private readonly calendarService: CalendarService,
    private readonly eventService: EventService
  ) {
    if (!this.token) {
      this.logger.warn("GEMINI_API_KEY not set. AIService disabled.");
      return;
    }
    this.genAI = new GoogleGenAI({
      apiKey: this.token
    });
  }
  async handlePrompt(user: IUserSession, prompt: string): Promise<void> {
    if (!this.token) return;

    const response = await this.genAI.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: prompt,
      config: {
        maxOutputTokens: this.maxOutputTokens,
        tools: [
          {
            functionDeclarations: [
              {
                name: "fnAnswerWithText",
                behavior: Behavior.BLOCKING,
                description: "Answer with text only"
              },
              {
                name: "fnCreateEvent",
                behavior: Behavior.BLOCKING,
                description: "Create an event in the user's calendar",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    start: {
                      type: Type.STRING,
                      description: "Start time of the event in ISO 8601 format"
                    },
                    end: {
                      type: Type.STRING,
                      description: "End time of the event in ISO 8601 format"
                    },
                    title: {
                      type: Type.STRING,
                      description: "Title of the event"
                    },
                    type: {
                      type: Type.STRING,
                      description: "Type of the event",
                      enum: [
                        EEventType.ARRANGEMENT,
                        EEventType.REMINDER,
                        EEventType.TASK,
                        EEventType.EVENT,
                        EEventType.HOLIDAY
                      ],
                      default: EEventType.ARRANGEMENT
                    }
                  },
                  required: ["start", "end", "title"]
                }
              }
            ]
          }
        ]
      }
    });

    const toolCalls = response.functionCalls;
    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const functionName = toolCall.name;
        const args = toolCall.args;

        if (!functionName) continue;
        if (!this[functionName]) {
          this.logger.warn(`Unknown function call: ${functionName}.`);
          continue;
        }

        await this[functionName](user, args);
      }
    }
  }

  // Functions / tools for the AI to use
  private async fnAnswerWithText(user: IUserSession, text: string) {}

  private async fnCreateEvent(user: IUserSession, text: string) {}

  private async fnCreateCalendar(user: IUserSession, text: string) {}

  private async fnRemoveEvent(user: IUserSession, text: string) {}

  private async fnWeatherWhenEvent(user: IUserSession, text: string) {}

  private async fnWeatherCurrent(user: IUserSession, text: string) {}

  private async fnRescheduleEvent(user: IUserSession, text: string) {}
}
