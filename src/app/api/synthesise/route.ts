import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { SYNTHESIS_METHOD, SynthesisSchema } from "@/lib/method";

// A full sample takes about 50 seconds, so 60 would time out on a slow run.
export const maxDuration = 300;

const MAX_INPUT_CHARS = 60_000;

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: { inputs?: unknown; company?: unknown };
  try {
    body = await request.json();
  } catch {
    return error("Request body must be JSON.", 400);
  }

  const inputs = typeof body.inputs === "string" ? body.inputs.trim() : "";
  const company =
    typeof body.company === "string" && body.company.trim()
      ? body.company.trim().slice(0, 100)
      : "the company";

  if (!inputs) {
    return error("Paste some research inputs before synthesising.", 400);
  }
  if (inputs.length > MAX_INPUT_CHARS) {
    return error(
      `Inputs are too long (${inputs.length.toLocaleString()} characters). Keep them under ${MAX_INPUT_CHARS.toLocaleString()}.`,
      400,
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return error("The server is missing its ANTHROPIC_API_KEY.", 500);
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: "claude-sonnet-5-5",
      max_tokens: 12000,
      output_config: {
        effort: "low",
        format: zodOutputFormat(SynthesisSchema),
      },
      system: SYNTHESIS_METHOD,
      messages: [
        {
          role: "user",
          content: `Company: ${company}\n\nResearch inputs, one verbatim per line:\n\n${inputs}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return error("The model declined to synthesise these inputs.", 500);
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      return error(
        "The synthesis was cut off before it finished. Try fewer inputs.",
        500,
      );
    }

    const result = response.parsed_output;
    const clusters = result.clusters
      .map((c) => ({ ...c, priority: c.frequency * c.severity }))
      .sort((a, b) => b.priority - a.priority);

    return Response.json({ clusters, firstTest: result.firstTest });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return error("The server's Anthropic API key was rejected.", 500);
    }
    if (err instanceof Anthropic.RateLimitError) {
      return error("Rate limited by the Claude API. Try again in a minute.", 500);
    }
    if (err instanceof Anthropic.APIError) {
      return error(`Claude API error (${err.status ?? "network"}): ${err.message}`, 500);
    }
    return error("Synthesis failed unexpectedly. Try again.", 500);
  }
}
