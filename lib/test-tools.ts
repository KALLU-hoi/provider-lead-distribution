import { createLeadAndAllocate, LeadRequestData } from './lead-allocation';
import { getServiceByName } from './services';

export async function createConcurrentLeads(serviceId: string, count: number) {
  const baseTimestamp = Date.now();
  const tasks = Array.from({ length: count }, (_, index) => {
    const leadData: LeadRequestData = {
      name: `Concurrent Lead ${baseTimestamp}-${index}`,
      phoneNumber: `+1555000${String(baseTimestamp).slice(-6)}${index}`,
      city: 'Test City',
      description: 'Simulated concurrent lead',
      serviceId
    };
    return createLeadAndAllocate(leadData);
  });

  return Promise.allSettled(tasks);
}

export async function getServiceIdByName(serviceName: string) {
  const service = await getServiceByName(serviceName);
  if (!service) {
    throw new Error(`Service ${serviceName} not found.`);
  }
  return service.id;
}
