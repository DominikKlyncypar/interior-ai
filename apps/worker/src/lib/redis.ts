import { ConnectionOptions } from 'bullmq'
import logger from './logger'

const getConnection = (): ConnectionOptions => {
  const config = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: {
      rejectUnauthorized: false
    }
  }
  logger.debug({ host: config.host, port: config.port }, 'Redis connection config')
  return config
}

export default getConnection