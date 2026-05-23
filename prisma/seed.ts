import { prisma } from '../lib/prisma';

const services = [
  { name: 'Service 1' },
  { name: 'Service 2' },
  { name: 'Service 3' }
];

const providers = [
  { name: 'Provider 1' },
  { name: 'Provider 2' },
  { name: 'Provider 3' },
  { name: 'Provider 4' },
  { name: 'Provider 5' },
  { name: 'Provider 6' },
  { name: 'Provider 7' },
  { name: 'Provider 8' }
];

const allocationStates = [
  { serviceName: 'Service 1', nextPoolIndex: 0 },
  { serviceName: 'Service 2', nextPoolIndex: 0 },
  { serviceName: 'Service 3', nextPoolIndex: 0 }
];

async function main() {
  console.log('Starting seed...');

  await prisma.leadAssignment.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.allocationState.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.service.deleteMany();

  const createdServices = await Promise.all(
    services.map((service) =>
      prisma.service.create({
        data: {
          name: service.name
        }
      })
    )
  );

  const createdProviders = await Promise.all(
    providers.map((provider) =>
      prisma.provider.create({
        data: {
          name: provider.name,
          monthlyQuota: 10,
          quotaRemaining: 10
        }
      })
    )
  );

  for (const state of allocationStates) {
    const service = createdServices.find((item) => item.name === state.serviceName);
    if (!service) continue;

    await prisma.allocationState.create({
      data: {
        serviceId: service.id,
        nextPoolIndex: state.nextPoolIndex
      }
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
