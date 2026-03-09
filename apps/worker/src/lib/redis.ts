import { ConnectionOptions } from 'bullmq'

const getConnection = (): ConnectionOptions => {
  const config = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    tls: {
      rejectUnauthorized: false
    }
  }
  return config
}

export default getConnection