import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export type LeadRequestData = {
  name: string;
  phoneNumber: string;
  city: string;
  description?: string;
  serviceId: string;
};

const MANDATORY_PROVIDER_MAP: Record<string, string[]> = {
  'Service 1': ['Provider 1'],
  'Service 2': ['Provider 5'],
  'Service 3': ['Provider 1', 'Provider 4']
};

const FAIR_POOL_MAP: Record<string, string[]> = {
  'Service 1': ['Provider 2', 'Provider 3', 'Provider 4'],
  'Service 2': ['Provider 6', 'Provider 7', 'Provider 8'],
  'Service 3': ['Provider 2', 'Provider 3', 'Provider 5', 'Provider 6', 'Provider 7', 'Provider 8']
};

export class AllocationError extends Error {}

export async function createLeadAndAllocate(leadData: LeadRequestData) {
  return await prisma.$transaction(
    async (tx) => {
      const service = await tx.service.findUnique({
        where: { id: leadData.serviceId }
      });

      if (!service) {
        throw new AllocationError(`Service ${leadData.serviceId} does not exist.`);
      }

      const mandatoryProviderNames = MANDATORY_PROVIDER_MAP[service.name] ?? [];
      const fairPoolProviderNames = FAIR_POOL_MAP[service.name] ?? [];

      if (mandatoryProviderNames.length > 3) {
        throw new AllocationError('Service has more than 3 mandatory providers, which violates assignment rules.');
      }

      const providerNames = Array.from(new Set([...mandatoryProviderNames, ...fairPoolProviderNames]));
      const providers = await tx.provider.findMany({
        where: {
          name: {
            in: providerNames
          }
        }
      });

      if (providers.length !== providerNames.length) {
        throw new AllocationError('Provider configuration is incomplete for the selected service.');
      }

      const providerByName = new Map(providers.map((provider) => [provider.name, provider]));
      const mandatoryProviders = mandatoryProviderNames.map((name) => {
        const provider = providerByName.get(name);
        if (!provider) {
          throw new AllocationError(`Mandatory provider ${name} not found.`);
        }
        return provider;
      });

      const mandatoryOutOfQuota = mandatoryProviders.find((provider) => provider.quotaRemaining <= 0);
      if (mandatoryOutOfQuota) {
        throw new AllocationError(`Mandatory provider ${mandatoryOutOfQuota.name} has reached quota.`);
      }

      const fairPoolProviders = fairPoolProviderNames.map((name) => {
        const provider = providerByName.get(name);
        if (!provider) {
          throw new AllocationError(`Fair pool provider ${name} not found.`);
        }
        return provider;
      });

      const allocationStateRows = await tx.$queryRaw<{
        id: string;
        nextPoolIndex: number;
      }[]>(Prisma.sql`
        SELECT "id", "nextPoolIndex"
        FROM "AllocationState"
        WHERE "serviceId" = ${service.id}
        FOR UPDATE
      `);

      const allocationState = allocationStateRows[0];
      if (!allocationState) {
        throw new AllocationError('Allocation state is missing for the selected service.');
      }

      const lockedProviderIds = providers.map((provider) => provider.id);
      await tx.$queryRaw(Prisma.sql`
        SELECT "id"
        FROM "Provider"
        WHERE "id" IN (${Prisma.join(lockedProviderIds.map((id) => Prisma.sql`${id}`))})
        FOR UPDATE
      `);

      const chosenProviderIds: string[] = [];
      const chosenProviderNames = new Set<string>();

      for (const provider of mandatoryProviders) {
        chosenProviderIds.push(provider.id);
        chosenProviderNames.add(provider.name);
      }

      let cursor = allocationState.nextPoolIndex;
      const poolLength = fairPoolProviders.length;
      let scanned = 0;

      while (chosenProviderIds.length < 3 && scanned < poolLength) {
        const candidate = fairPoolProviders[cursor];
        if (!chosenProviderNames.has(candidate.name) && candidate.quotaRemaining > 0) {
          chosenProviderIds.push(candidate.id);
          chosenProviderNames.add(candidate.name);
        }

        cursor = (cursor + 1) % poolLength;
        scanned += 1;
      }

      if (chosenProviderIds.length < 3) {
        throw new AllocationError('Unable to allocate 3 providers: not enough quota available.');
      }

      const createdLead = await tx.lead.create({
        data: {
          name: leadData.name,
          phoneNumber: leadData.phoneNumber,
          city: leadData.city,
          description: leadData.description,
          serviceId: service.id
        }
      });

      const assignments = [] as Array<Awaited<ReturnType<typeof tx.leadAssignment.create>>>;

      for (const providerId of chosenProviderIds) {
        const provider = providers.find((item) => item.id === providerId);
        if (!provider) {
          throw new AllocationError('Provider details missing during assignment.');
        }

        await tx.provider.update({
          where: { id: provider.id },
          data: {
            quotaRemaining: {
              decrement: 1
            }
          }
        });

        const assignment = await tx.leadAssignment.create({
          data: {
            leadId: createdLead.id,
            providerId: provider.id,
            assignedKind: mandatoryProviderNames.includes(provider.name) ? 'MANDATORY' : 'FAIR'
          }
        });

        assignments.push(assignment);
      }

      await tx.allocationState.update({
        where: { serviceId: service.id },
        data: {
          nextPoolIndex: cursor
        }
      });

      return {
        lead: createdLead,
        assignments
      };
    },
    {
      isolationLevel: 'Serializable'
    }
  );
}
