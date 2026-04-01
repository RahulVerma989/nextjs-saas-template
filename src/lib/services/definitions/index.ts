import { registerExampleService } from './example.service';

/**
 * Register all background service definitions.
 * Add your service registrations here.
 */
export function registerAllServices(): void {
  registerExampleService();

  // Add more service registrations here:
  // registerMyCustomService();
}
