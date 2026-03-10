import dotenv from 'dotenv'
dotenv.config()
import { Worker } from 'bullmq'
import getConnection from './lib/redis'
import { JobNames } from './queues/jobs'
import logger from './lib/logger'
import { startScheduler } from './scheduler'

const connection = getConnection()

logger.info('Worker starting...')

const worker = new Worker(
  'agent-jobs',
  async (job) => {
    logger.info(`Running job: ${job.name}`)

    switch (job.name) {
      case JobNames.PROCESS_EMAILS:
        const { emailAgent } = await import('./agents/email/email.agent')
        await emailAgent.run()
        break

      case JobNames.SCAN_LEADS:
        logger.info('Leads agent coming soon...')
        break

      default:
        logger.warn(`Unknown job: ${job.name}`)
    }
  },
  { connection }
)

worker.on('completed', (job) => {
  logger.info(`Job completed: ${job.name}`)
})

worker.on('failed', (job, err) => {
  logger.error(`Job failed: ${job?.name} - ${err.message}`)
})

const queueEvents = new QueueEvents('agent-jobs', { connection })

queueEvents.on('stalled', ({ jobId }) => {
  logger.warn(`Job stalled: ${jobId} — will retry automatically`)
})

logger.info('Worker ready and listening for jobs')

startScheduler()