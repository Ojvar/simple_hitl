export class Conversation {
  accepted_by?: string;
  accepted_at?: Date;
  finished_at?: Date;

  constructor(
    public readonly id: string,
    public readonly web_hook: string,
    public readonly web_hook_meta: any = {},
    public readonly requested_at: Date = new Date(),
  ) {}

  accept(user_id: string): void {
    this.accepted_at = new Date();
    this.accepted_by = user_id;
  }

  finish(user_id: string): void {
    const now = new Date();
    this.accepted_at = now;
    this.accepted_by = user_id;
    this.finished_at = now;
  }
}
export type Conversations = Conversation[];

enum EnumMessageType {
  ACCEPTED = "ACCEPTED",
  FINISHED = "FINISHED",
  MSG = "MESSAGE",
}

export class ConversationManager {
  constructor(private conversations: Conversations = []) {}

  all_conversations(): Conversations {
    return this.conversations;
  }

  unaccepted_requests(): Conversations {
    return this.conversations.filter((session) => !session.accepted_by);
  }

  unfinished_requests(): Conversations {
    return this.conversations.filter(
      (session) => session.accepted_by && !session.finished_at,
    );
  }

  create_request(
    conversation_id: string,
    web_hook: string,
    web_hook_meta: any,
  ): Conversation {
    const old_conversation = this.conversations.find(
      (converstion) => converstion.id === conversation_id,
    );
    if (old_conversation) {
      return old_conversation;
    }
    const conversation = new Conversation(
      conversation_id,
      web_hook,
      web_hook_meta,
    );
    this.conversations.push(conversation);
    console.debug(this.conversations, conversation);
    return conversation;
  }

  finish_session(user_id: string, conversation_id: string): void {
    const conversation = this.conversations.find(
      (c) => c.id === conversation_id,
    );
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    conversation.accepted_by = conversation.accepted_by ?? user_id;
    conversation.finish(user_id);
    this.send_message(conversation, {
      type: EnumMessageType.FINISHED,
      body: "Rejected",
    });
  }

  accept_session(user_id: string, conversation_id: string): void {
    const conversation = this.conversations.find(
      (conversation) => conversation.id === conversation_id,
    );
    if (!conversation) {
      throw new Error("Conversation not found");
    }
    conversation.accept(user_id);
    this.send_message(conversation, {
      type: EnumMessageType.ACCEPTED,
      body: "",
    });
  }

  receive_message(conversation_id: string, message: string): void {
    /// TODO: Implement this
    console.debug("Received Message should delivered to the HITL USER", {
      conversation_id,
      message,
    });
  }

  private async send_message(
    conversation: Conversation,
    data: { type: string; body: string },
  ): Promise<any> {
    const fetchResult = await fetch(conversation.web_hook, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...conversation.web_hook_meta,
      },
      body: JSON.stringify(data),
    });
    return fetchResult.json();
  }
}
