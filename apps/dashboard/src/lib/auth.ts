import { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import { getSupabase } from '@/lib/supabase'
import logger from '@/lib/logger'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send',
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID ?? '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
      tenantId: process.env.AZURE_AD_TENANT_ID ?? 'common',
      authorization: {
        params: {
          scope: 'openid email profile offline_access https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send',
          prompt: 'consent'
        }
      }
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      try {
        const supabase = getSupabase()

        if (account?.provider === 'google') {
          const { error } = await supabase.from('connected_accounts').upsert(
            {
              user_email: profile?.email,
              provider: 'gmail',
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: new Date(account.expires_at! * 1000).toISOString(),
              fetch_since: new Date().toISOString()
            },
            {
              onConflict: 'user_email,provider'
            }
          )

          if (error) {
            logger.error(`Supabase upsert error: ${error.message}`)
            return false
          }

          logger.info(`Gmail account saved for ${profile?.email}`)
        }

        if (account?.provider === 'azure-ad') {
          logger.info(`Outlook scopes: ${account.scope}`)
          logger.info(`Outlook token type: ${account.token_type}`)

          const { error } = await supabase.from('connected_accounts').upsert(
            {
              user_email: profile?.email,
              provider: 'outlook',
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: new Date(account.expires_at! * 1000).toISOString(),
              fetch_since: new Date().toISOString()
            },
            {
              onConflict: 'user_email,provider'
            }
          )

          if (error) {
            logger.error(`Supabase upsert error: ${error.message}`)
            return false
          }

          logger.info(`Outlook account saved for ${profile?.email}`)
        }

        return true
      } catch (err: any) {
        logger.error(`signIn error: ${err.message}`)
        return false
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      if (url === '/') return `${baseUrl}/`
      return `${baseUrl}/onboarding`
    },
    async session({ session }) {
      return session
    }
  }
}
