import dotenv from 'dotenv'
dotenv.config()
import { getAgentQueue, JobNames } from '../queues/jobs'

async function trigger() {
  const queue = getAgentQueue()
  
  const job = await queue.add(JobNames.PROCESS_EMAILS, {})
  console.log(`Job added: ${job.id}`)
  
  process.exit(0)
}

trigger()