import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getSupabase } from '@/lib/supabase'
import logger from '@/lib/logger'

const handler = NextAuth({
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
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        logger.error('Missing Google credentials')
        return false
      }
      try {
        const supabase = getSupabase()
        if (account?.provider === 'google') {
          const { error } = await supabase.from('connected_accounts').upsert({
            user_email: profile?.email,
            provider: 'gmail',
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: new Date(account.expires_at! * 1000).toISOString(),
            fetch_since: new Date().toISOString()
          }, {
            onConflict: 'user_email,provider'
          })
          if (error) {
            logger.error(`Supabase upsert error: ${error.message}`)
            return false
          }
          logger.info(`✅ Connected account saved for ${profile?.email}`)
        }
        return true
      } catch (err: any) {
        logger.error(`signIn error: ${err.message}`)
        return false
      }
    },
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/onboarding`
    },
    async session({ session }) {
      return session
    }
  }
})

export { handler as GET, handler as POST }