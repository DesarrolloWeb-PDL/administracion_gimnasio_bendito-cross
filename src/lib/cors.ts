import { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://benditocross.vercel.app',
  'https://bendito-cross.vercel.app',
];

/**
 * Returns CORS headers with the correct origin for the request.
 * Allows benditocross.vercel.app and any Vercel preview deployment.
 */
export function getCorsHeaders(request?: NextRequest): Record<string, string> {
  const origin = request?.headers.get('origin') || '';
  
  // Allow known production origins
  if (ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }
  
  // Allow any Vercel preview deployment (bendito-cross-*.vercel.app)
  if (/^https:\/\/bendito-cross-[a-z0-9]+-desarrolloweb-pdl\.vercel\.app$/.test(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }

  // Default: use production origin
  return {
    'Access-Control-Allow-Origin': 'https://benditocross.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
