import type { InMemoryConversationRepositoryContract } from "../conversation/conversationRepository.js";

export interface SessionResult {
  anonymousUserId: string;
  isNew: boolean;
}

export class AnonymousSessionService {
  constructor(private readonly repository: InMemoryConversationRepositoryContract) {}

  getOrCreate(cookieUserId: string | undefined): SessionResult {
    if (cookieUserId) {
      const user = this.repository.touchAnonymousUser(cookieUserId);
      if (user) {
        return {
          anonymousUserId: user.id,
          isNew: false
        };
      }
    }

    const user = this.repository.createAnonymousUser();
    return {
      anonymousUserId: user.id,
      isNew: true
    };
  }
}
