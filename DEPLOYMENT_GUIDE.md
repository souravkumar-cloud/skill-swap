# Deployment Guide - OAuth Configuration

## Problem
After deployment, Google OAuth callback shows `localhost:3000` in the URL instead of your production domain. This happens because:
1. The production callback URL needs to be added to Google Cloud Console
2. Environment variables need to be set in Vercel

## Solution

### Step 1: Update Google Cloud Console OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID (the one you're using for this app)
4. Click **Edit** (pencil icon)
5. Under **Authorized redirect URIs**, add these URLs:
   - `https://your-production-domain.vercel.app/api/auth/callback/google`
   - `https://your-custom-domain.com/api/auth/callback/google` (if you have a custom domain)
   - Keep `http://localhost:3000/api/auth/callback/google` for local development

6. Click **Save**

### Step 2: Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add/Update these variables:

   **Required Variables:**
   - `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret
   - `NEXTAUTH_SECRET` - A random secret string (generate one with `openssl rand -base64 32`)
   - `AUTH_URL` - Your production URL (e.g., `https://your-app.vercel.app`)
   - `MONGODB_URI` - Your MongoDB connection string

   **For Production:**
   - Set `AUTH_URL` to your production URL: `https://your-app.vercel.app`
   - Make sure `NEXTAUTH_SECRET` is the same across all environments or use different secrets for dev/prod

4. Click **Save** for each variable
5. **Redeploy** your application after adding environment variables

### Step 3: Verify Configuration

After deployment:
1. Visit your production site
2. Try to sign in with Google
3. The callback URL should now show your production domain instead of localhost

### Important Notes

- **Multiple Environments**: If you have multiple Vercel deployments (Preview, Production), you may need to add callback URLs for each:
  - `https://your-app.vercel.app/api/auth/callback/google` (Production)
  - `https://your-app-git-main-username.vercel.app/api/auth/callback/google` (Preview)

- **Custom Domain**: If you're using a custom domain, make sure to add that callback URL as well

- **Security**: Never commit `.env.local` or `.env` files to Git. Always use Vercel's environment variables for production secrets.

## Troubleshooting

### Still seeing localhost in callback URL?

1. Clear your browser cache and cookies
2. Make sure you've redeployed after adding environment variables
3. Check Vercel logs for any errors
4. Verify that `AUTH_URL` is set correctly in Vercel environment variables

### Getting "redirect_uri_mismatch" error?

This means the callback URL in your request doesn't match what's configured in Google Cloud Console. Make sure:
- The exact production URL is added to Google Cloud Console
- The URL matches exactly (including https:// and /api/auth/callback/google)
- You've saved the changes in Google Cloud Console

## Code Changes Made

The following changes have been made to `auth.ts`:
- Added `trustHost: true` to trust the host header in production
- Added `redirect` callback to properly handle callback URLs
- This ensures NextAuth uses the correct base URL in production

