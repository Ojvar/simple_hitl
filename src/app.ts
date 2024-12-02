"use strict";

import { Elysia } from "elysia";
import {
  ConversationManager,
  type Conversations,
} from "./conversation-manager";

export class App {
  constructor(
    private port: number,
    private host: string,
    private app = new Elysia(),
    private conversation_manager = new ConversationManager(),
  ) {
    this.define_routes();
  }

  get webApp(): Elysia {
    return this.app;
  }

  private parse_hook({ body: { type, data } }: any): {
    error?: string;
  } {
    console.debug({
      method: "parse_hook",
      body: { type, data },
    });

    if (!data.conversation_id) {
      throw new Error("Invalid Converation Id");
    }

    const funcs = {
      ["create-request"]: () =>
        this.request_meeting(
          data.conversation_id,
          data.web_hook,
          data.web_hook_headers,
        ),
      ["message"]: () =>
        this.receive_message(data.conversation_id, data.message),
    };
    return funcs[type as keyof typeof funcs]();
  }

  private receive_message(
    conversation_id: string,
    message: string,
  ): {
    error?: string;
  } {
    if (!conversation_id) {
      throw new Error("Invalid Converation Id");
    }
    this.conversation_manager.receive_message(conversation_id, message);
    return { error: undefined };
  }

  private request_meeting(
    conversation_id: string,
    web_hook: string,
    web_hook_headers: any = {},
  ): {
    error?: string;
  } {
    if (!conversation_id) {
      throw new Error("Invalid Converation Id");
    }
    this.conversation_manager.create_request(
      conversation_id,
      web_hook,
      web_hook_headers,
    );
    return { error: undefined };
  }

  private unaccepted_reuquests(): Conversations {
    return this.conversation_manager.unaccepted_requests();
  }

  private unfinished_reuquests(): Conversations {
    return this.conversation_manager.unfinished_requests();
  }

  private async accept_conversation({
    params: { id },
    body: { user_id },
  }: any) {
    console.debug(id, user_id);
    if (!user_id || !id) {
      throw new Error("Invalid Arguments");
    }
    await this.conversation_manager.accept_conversation(user_id, id);
    return { error: undefined };
  }

  private async reject_conversation({
    params: { id },
    body: { user_id },
  }: any) {
    if (!user_id || !id) {
      throw new Error("Invalid Arguments");
    }
    await this.conversation_manager.finish_conversation(user_id, id);
    return { error: undefined };
  }

  private async send_message({ params: { id }, body: { user_id, body } }: any) {
    if (!user_id || !id || !body) {
      throw new Error("Invalid Arguments");
    }
    await this.conversation_manager.send_conversation_message(
      user_id,
      id,
      body,
    );
    return { error: undefined };
  }

  private define_routes() {
    this.app.onError(({ set, error }) => {
      console.error(error);
      set.status = 500;
      return { error };
    });

    /// Botpres Side
    this.app.post("/hook", (request) => this.parse_hook(request));

    /// HITL Side
    this.app.post("/conversations/:id/accept", (request) =>
      this.accept_conversation(request),
    );
    this.app.post("/conversations/:id/reject", (request) =>
      this.reject_conversation(request),
    );
    this.app.post("/conversations/:id/message", (request) =>
      this.send_message(request),
    );
    this.app.get("/conversations/unaccepted-list", () =>
      this.unaccepted_reuquests(),
    );
    this.app.get("/conversations/unfinished-list", () =>
      this.unfinished_reuquests(),
    );

    //this.app.post("/webhook", this.receive_hook);
    this.app.get("/send-hook", this.send_to_hook.bind(this));

    this.app.all("*", ({ set }) => {
      set.status = 404;
      return {
        status: 404,
        message: "Route not found",
      };
    });
  }

  //private async receive_hook({ body }: { body: unknown }) {
  //  console.log("Webhook received:", body);
  //  return "Webhook received!";
  //}

  private async send_to_hook({
    query = {},
  }: {
    query: Record<string, string>;
  }): Promise<void> {
    const url =
      "https://webhook.botpress.cloud/0082b408-7639-458b-875b-b37b6a5973a0";
    const data = {
      user: "Amir Ojvar",
      message: "Test Text Message",
      conversationId: query["c-id"],
    };
    const fetchResult = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-bp-secret": "secret" },
      body: JSON.stringify(data),
    });
    const result = await fetchResult.text();
    console.debug({ result });
  }

  run() {
    this.app.listen(
      {
        port: this.port,
        hostname: this.host,
      },
      () => console.log(`Server are running on ${this.host}:${this.port}`),
    );
  }
}
