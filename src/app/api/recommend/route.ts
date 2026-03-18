import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

// POST /api/recommend — AI-powered product recommendations
export async function POST(req: NextRequest) {
  const { query, products } = await req.json();

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  // If we have an Anthropic API key, use Claude for smart recommendations
  if (ANTHROPIC_API_KEY) {
    try {
      const productList = (products || [])
        .slice(0, 50)
        .map((p: { name: string; category: string; clientPrice: number | null }, i: number) =>
          `${i + 1}. ${p.name} (${p.category}) - $${p.clientPrice ? (p.clientPrice / 100).toFixed(2) : "N/A"}`
        )
        .join("\n");

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: `You are a corporate merch consultant. A client said: "${query}"

Here are available products:
${productList}

Recommend the top 5 best products for their needs. Return ONLY a JSON array of the product numbers (1-indexed), like [3, 7, 12, 1, 8]. No explanation, just the array.`,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.[0]?.text || "[]";
        const match = text.match(/\[[\d,\s]+\]/);
        if (match) {
          const indices = JSON.parse(match[0]);
          return NextResponse.json({ recommended: indices, ai: true });
        }
      }
    } catch (e) {
      console.error("AI recommendation failed:", e);
    }
  }

  // Fallback: keyword-based matching
  const keywords = query.toLowerCase().split(/\s+/);
  const scored = (products || []).map((p: { name: string; category: string; description?: string }, i: number) => {
    const text = `${p.name} ${p.category} ${p.description || ""}`.toLowerCase();
    let score = 0;

    // Direct keyword matches
    for (const kw of keywords) {
      if (text.includes(kw)) score += 10;
    }

    // Intent matching
    const intentMap: Record<string, string[]> = {
      breathable: ["performance", "dri-fit", "dry", "moisture", "wicking", "cool", "lightweight", "mesh", "pique", "sport"],
      premium: ["nike", "north face", "carhartt", "brooks brothers", "eddie bauer", "ogio", "travis", "puma", "under armour"],
      casual: ["cotton", "jersey", "soft", "comfort", "basic", "classic", "everyday"],
      winter: ["fleece", "insulated", "thermal", "heavy", "sherpa", "beanie", "puffer", "down"],
      summer: ["lightweight", "cool", "moisture", "breathable", "tank", "short sleeve", "performance"],
      outdoor: ["waterproof", "wind", "trail", "rain", "soft shell", "hard shell"],
      office: ["polo", "dress", "professional", "oxford", "button", "collar"],
      women: ["women", "ladies", "girl", "female"],
      men: ["men", "unisex", "guy"],
      team: ["tee", "shirt", "hoodie", "hat", "matching"],
      gift: ["premium", "hoodie", "jacket", "blanket", "tumbler", "backpack"],
      "new hire": ["tee", "polo", "hat", "mug", "notebook", "welcome"],
      event: ["tee", "shirt", "hat", "bag", "tote", "bottle"],
    };

    for (const [intent, matches] of Object.entries(intentMap)) {
      if (keywords.some((k: string) => intent.includes(k) || k.includes(intent))) {
        for (const m of matches) {
          if (text.includes(m)) score += 5;
        }
      }
    }

    return { index: i + 1, score };
  });

  const recommended = (scored as Array<{ index: number; score: number }>)
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((s) => s.index);

  return NextResponse.json({ recommended, ai: false });
}
