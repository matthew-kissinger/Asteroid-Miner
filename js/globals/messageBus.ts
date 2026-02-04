import { MessageBus } from '../core/messageBus.ts';

type GlobalWithMessageBus = { mainMessageBus?: MessageBus };

const globalWithMessageBus = globalThis as GlobalWithMessageBus;

export const mainMessageBus: MessageBus = globalWithMessageBus.mainMessageBus ?? new MessageBus();

if (!globalWithMessageBus.mainMessageBus) {
    globalWithMessageBus.mainMessageBus = mainMessageBus;
}
