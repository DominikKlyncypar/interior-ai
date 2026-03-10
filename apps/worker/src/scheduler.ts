import { getAgentQueue, JobNames } from './queues/jobs'
import logger from './lib/logger'

const SCHEDULES = {
  [JobNames.PROCESS_EMAILS]: 10 * 60 * 1000, // every 10 minutes
  [JobNames.SCAN_LEADS]: 6 * 60 * 60 * 1000, // every 6 hours
}

export const startScheduler = async () => {
  const queue = getAgentQueue()
  logger.info('Scheduler starting...')

  for (const [jobName, interval] of Object.entries(SCHEDULES)) {
    // Run immediately on startup
    await queue.add(jobName, {})
    logger.info(`Queued initial run: ${jobName}`)

    // Then run on interval
    setInterval(async () => {
      await queue.add(jobName, {})
      logger.info(`Queued scheduled run: ${jobName}`)
    }, interval)
  }

  logger.info('Scheduler running')
}