import { prisma } from './prisma';

export async function getServiceList() {
  return prisma.service.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getServiceByName(name: string) {
  return prisma.service.findUnique({
    where: { name }
  });
}
