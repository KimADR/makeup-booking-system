import { clerkMiddleware } from '@clerk/nextjs/server';

// Wrapper middleware to optionally log requests for debugging.
// This helps confirm whether the middleware runs for `/sign-in` requests.
export default function middleware(req: Request) {
  try {
    // @ts-ignore - Request may not have nextUrl in some contexts in TS server types
    // We only log for debugging; remove these logs after diagnosing.
    // eslint-disable-next-line no-console
    console.log('[middleware] request pathname:', (req as any).nextUrl?.pathname || req['url']);
  } catch (e) {
    // ignore logging errors
  }

  // Call Clerk middleware - cast to any to avoid TypeScript signature mismatch in this debug wrapper
  return (clerkMiddleware() as any)(req as any);
}

export const config = {
  matcher: [
    // Skip Next.js internals, sign-in/sign-up pages and all static files, unless found in search params
    '/((?!_next|sign-in|sign-up|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 