export default function handler(_req: unknown, res: { status: (c: number) => { json: (b: unknown) => void } }) {
  res.status(200).json({
    status: 'ok',
    assistant: 'SAM',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    hasSupabase: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    time: new Date().toISOString(),
  });
}
