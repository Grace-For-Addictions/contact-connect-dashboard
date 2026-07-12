// invoke-llm — Base44 `InvokeLLM` replacement backed by the Claude API.
//
// Request body: { prompt: string, response_json_schema?: object,
//                 add_context_from_internet?: boolean }
// - With response_json_schema: returns a JSON object matching that schema
//   (produced via Claude tool-forced structured output).
// - Without it: returns { response: "<text>" }.
//
// Requires the ANTHROPIC_API_KEY secret. Model overridable via LLM_MODEL.
import { corsHeaders, json } from '../_shared/cors.ts';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-5';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return json({ error: 'ANTHROPIC_API_KEY is not set for this function.' }, 500);
  }

  let payload: {
    prompt?: string;
    response_json_schema?: Record<string, unknown>;
    add_context_from_internet?: boolean;
  };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const { prompt, response_json_schema } = payload;
  if (!prompt) return json({ error: 'Missing "prompt".' }, 400);

  const model = Deno.env.get('LLM_MODEL') || DEFAULT_MODEL;

  const body: Record<string, unknown> = {
    model,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  };

  // When a schema is requested, force a tool call so the model returns a
  // structured object we can hand straight back to the caller.
  if (response_json_schema) {
    body.tools = [
      {
        name: 'format_response',
        description: 'Return the response using the required structure.',
        input_schema: response_json_schema,
      },
    ];
    body.tool_choice = { type: 'tool', name: 'format_response' };
  }

  let resp: Response;
  try {
    resp = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return json({ error: `Upstream request failed: ${String(e)}` }, 502);
  }

  if (!resp.ok) {
    const detail = await resp.text();
    return json({ error: 'Claude API error', status: resp.status, detail }, 502);
  }

  const result = await resp.json();
  const blocks: Array<{ type: string; text?: string; input?: unknown }> =
    result.content || [];

  if (response_json_schema) {
    const toolBlock = blocks.find((b) => b.type === 'tool_use');
    if (toolBlock) return json(toolBlock.input);
    // Fallback: try to parse text as JSON.
    const text = blocks.find((b) => b.type === 'text')?.text ?? '{}';
    try {
      return json(JSON.parse(text));
    } catch {
      return json({ error: 'Model did not return structured output', raw: text }, 502);
    }
  }

  const text = blocks.map((b) => b.text ?? '').join('').trim();
  return json({ response: text });
});
