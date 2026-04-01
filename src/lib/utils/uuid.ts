import { v7 as uuidv7 } from 'uuid';

export function generateUUID7(): string {
  return uuidv7();
}

export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function getTimestampFromUUID7(uuid: string): Date | null {
  if (!isValidUUID(uuid)) return null;
  try {
    const hex = uuid.replace(/-/g, '').slice(0, 12);
    const timestamp = parseInt(hex, 16);
    return new Date(timestamp);
  } catch {
    return null;
  }
}
