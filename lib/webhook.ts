import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export type WebhookPayload = unknown;

export async function processWebhookEvent(
  externalId: string,
  eventType: string,
  payload: WebhookPayload
) {
  return await prisma.$transaction(
    async (tx) => {
      const existingEvent = await tx.webhookEvent.findUnique({
        where: { externalId }
      });

      if (existingEvent && existingEvent.succeeded) {
        return existingEvent;
      }

      const payloadValue: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined =
        payload === undefined ? undefined : payload === null ? Prisma.JsonNull : (payload as Prisma.InputJsonValue);

      const event =
        existingEvent ??
        (await tx.webhookEvent.create({
          data: {
            externalId,
            eventType,
            payload: payloadValue
          }
        }));

      if (eventType !== 'RESET_QUOTA') {
        throw new Error(`Unsupported webhook event type: ${eventType}`);
      }

      await tx.provider.updateMany({
        data: {
          monthlyQuota: 10,
          quotaRemaining: 10
        }
      });

      return tx.webhookEvent.update({
        where: { id: event.id },
        data: {
          succeeded: true,
          processedAt: new Date(),
          payload: payloadValue
        }
      });
    },
    {
      isolationLevel: 'Serializable'
    }
  );
}

export async function safeProcessWebhookEvent(
  externalId: string,
  eventType: string,
  payload: WebhookPayload
) {
  try {
    return await processWebhookEvent(externalId, eventType, payload);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { externalId }
      });
      if (existingEvent) {
        return existingEvent;
      }
    }
    throw error;
  }
}
