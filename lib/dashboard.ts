import { prisma } from './prisma';

export async function getProviderDashboard() {
  const providers = await prisma.provider.findMany({
    orderBy: { name: 'asc' },
    include: {
      assignments: {
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
              city: true,
              description: true,
              createdAt: true
            }
          }
        }
      }
    }
  });

  return providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
    monthlyQuota: provider.monthlyQuota,
    quotaRemaining: provider.quotaRemaining,
    receivedCount: provider.assignments.length,
    assignedLeads: provider.assignments.map((assignment) => ({
      id: assignment.lead.id,
      name: assignment.lead.name,
      phoneNumber: assignment.lead.phoneNumber,
      city: assignment.lead.city,
      description: assignment.lead.description,
      assignedAt: assignment.assignedAt,
      kind: assignment.assignedKind
    }))
  }));
}
