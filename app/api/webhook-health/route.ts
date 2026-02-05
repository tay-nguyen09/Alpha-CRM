import { NextResponse } from 'next/server';

// Simple test endpoint to check if webhook URL is accessible from Facebook
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Webhook endpoint is accessible',
        timestamp: new Date().toISOString(),
        webhookUrl: '/api/webhooks/meta'
    });
}
