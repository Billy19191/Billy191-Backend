import crypto from 'crypto'
export function encryptHmac(data: string, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex')
}
