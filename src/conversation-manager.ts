export class Conversation {
  accepted_by?: string;
  accepted_at?: Date;
  finished_at?: Date;

  constructor(
    public readonly id: string,
    public readonly web_hook: string,
    public readonly web_hook_headers: any = {},
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
    web_hook_headers: any,
  ): Conversation {
    const old_conversation = this.find_conversation<Conversation | undefined>(
      conversation_id,
      (conv) => !conv.finished_at,
      false,
    );
    if (old_conversation) {
      return old_conversation;
    }
    const conversation = new Conversation(
      conversation_id,
      web_hook,
      web_hook_headers,
    );
    this.conversations.push(conversation);
    /// TODO: CREATE CONVERSATION
    return conversation;
  }

  async finish_conversation(
    user_id: string,
    conversation_id: string,
  ): Promise<void> {
    const conversation = this.find_conversation(
      conversation_id,
      (conv) => !conv.accepted_at,
    );
    conversation.accepted_by = conversation.accepted_by ?? user_id;
    conversation.finish(user_id);
    /// TODO: UPDATE CONVERSTAION
    await this.send_message(conversation, {
      type: EnumMessageType.FINISHED,
      body: "Rejected",
    });
  }

  async accept_conversation(
    user_id: string,
    conversation_id: string,
  ): Promise<void> {
    const conversation = this.find_conversation(
      conversation_id,
      (conv) => !conv.accepted_at,
    );
    conversation.accept(user_id);
    /// TODO: UPDATE CONVERSTAION
    return this.send_message(conversation, {
      type: EnumMessageType.ACCEPTED,
      body: "Accepted",
    });
  }

  receive_message(conversation_id: string, message: string): void {
    /// TODO: Implement this
    console.debug("Received Message should delivered to the HITL USER", {
      conversation_id,
      message,
    });
  }

  async send_conversation_message(
    user_id: string,
    conversation_id: string,
    message: string,
  ): Promise<void> {
    const conversation = this.find_conversation(conversation_id);
    /// TODO: SAVE MESSAGE
    return this.send_message(conversation, { type: "MSG", body: message });
  }

  private async send_message(
    conversation: Conversation,
    data: { type: string; body: string },
  ): Promise<any> {
      const fetchResult = await fetch(conversation.web_hook, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...conversation.web_hook_headers,
      },
      body: JSON.stringify(data),
    });
    return fetchResult.json();
  }

  private find_conversation<T = Conversation>(
    conversation_id: string,
    check_func?: (conv: Conversation) => boolean,
    raise_error = true,
  ): T {
    const conversation = this.conversations.find(
      (conv) =>
        conv.id === conversation_id && (!check_func || check_func(conv)),
    );
    if (!conversation && raise_error) {
      throw new Error("Conversation not found");
    }
    return conversation as T;
  }
}
