import { Queue } from 'bullmq'
import connection from '../lib/redis'

export const agentQueue = new Queue('agent-jobs', { connection })

export const JobNames = {
  PROCESS_EMAILS: 'process-emails',
  SCAN_LEADS: 'scan-leads',
  UPDATE_CRM: 'update-crm',
  FINANCIAL_REPORT: 'financial-report',
} as const