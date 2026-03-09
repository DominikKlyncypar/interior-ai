import { Queue } from 'bullmq'
import getConnection from '../lib/redis'

export const JobNames = {
  PROCESS_EMAILS: 'process-emails',
  SCAN_LEADS: 'scan-leads',
  UPDATE_CRM: 'update-crm',
  FINANCIAL_REPORT: 'financial-report',
} as const

export const getAgentQueue = () => new Queue('agent-jobs', { connection: getConnection() })