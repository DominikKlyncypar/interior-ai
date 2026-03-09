import dotenv from 'dotenv'
dotenv.config()
import { Worker } from 'bullmq'
import getConnection from './lib/redis'
import { JobNames } from './queues/jobs'

const connection = getConnection()

console.log('🤖 Worker starting...')

const worker = new Worker(
  'agent-jobs',
  async (job) => {
    console.log(`Running job: ${job.name}`)

    switch (job.name) {
      case JobNames.PROCESS_EMAILS:
        const { emailAgent } = await import('./agents/email.agent')
        await emailAgent.run()
        console.log('Email agent coming soon...')
        break

      case JobNames.SCAN_LEADS:
        // const { leadsAgent } = await import('./agents/leads.agent')
        // await leadsAgent.run()
        console.log('Leads agent coming soon...')
        break

      default:
        console.warn(`Unknown job: ${job.name}`)
    }
  },
  { connection }
)

worker.on('completed', (job) => {
  console.log(`✅ Job completed: ${job.name}`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Job failed: ${job?.name}`, err.message)
})

console.log('✅ Worker ready and listening for jobs')