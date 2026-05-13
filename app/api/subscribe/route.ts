import { subscribeToList } from '@/lib/email/beehiiv';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, dailyDigestOptIn } = body as Record<string, unknown>;

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    return Response.json({ error: 'Invalid email' }, { status: 400 });
  }

  try {
    await subscribeToList({
      email,
      dailyDigestOptIn: !!dailyDigestOptIn
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return Response.json({ error: 'Subscription failed' }, { status: 500 });
  }
}
