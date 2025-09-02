import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cubeId = params.id

    // Fetch cube data from Cube Cobra API
    const response = await fetch(`https://cubecobra.com/cube/api/cubejson/${cubeId}`)

    if (!response.ok) {
      throw new Error("Failed to fetch cube data")
    }

    const cubeData = await response.json()

    console.log("[v0] Cube data structure:", typeof cubeData, Object.keys(cubeData))
    console.log("[v0] Sample of cubeData:", JSON.stringify(cubeData).substring(0, 500))

    let cubeCards = []
    cubeCards = cubeData.cards.mainboard

    console.log("[v0] Found cards array with length:", cubeCards.length)
    console.log("[v0] Sample card:", JSON.stringify(cubeCards[0], null, 2))

    const cardsWithDetails = cubeCards.map((card: any) => {
      // Parse mana cost from parsed_cost array to display format
      const parsedCost = card.details.parsed_cost || []
      const mana_cost = parsedCost
        .map((symbol: string) => {
          // Convert single letters to mana symbols
          if (symbol.length === 1) {
            return `{${symbol.toUpperCase()}}`
          }
          return `{${symbol}}`
        })
        .join("")

      return {
        name: card.details.name,
        mana_cost: mana_cost,
        cmc: card.details.cmc || card.cmc || 0,
        colors: card.details.colors || card.colors || [],
        type_line: card.details.type || card.type_line || "",
        set: card.details.set || "",
        set_name: card.details.set_name || "",
        oracle_text: card.details.oracle_text || "",
        image_uris: {
          normal: card.details.image_normal,
          small: card.details.image_small,
          art_crop: card.details.art_crop,
        },
      }
    })

    return NextResponse.json({
      cards: cardsWithDetails,
    })
  } catch (error) {
    console.error("Error in cube API:", error)
    return NextResponse.json({ error: "Failed to fetch cube data" }, { status: 500 })
  }
}
