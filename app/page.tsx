"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shuffle, Eye, EyeOff, Search, HelpCircle, ChevronDown, ChevronUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// — Inserted for mana symbol support —
const manaSymbolMap: Record<string, string> = {
  // Mono
  W: "https://svgs.scryfall.io/card-symbols/W.svg",
  U: "https://svgs.scryfall.io/card-symbols/U.svg",
  B: "https://svgs.scryfall.io/card-symbols/B.svg",
  R: "https://svgs.scryfall.io/card-symbols/R.svg",
  G: "https://svgs.scryfall.io/card-symbols/G.svg",
  C: "https://svgs.scryfall.io/card-symbols/C.svg",
  S: "https://svgs.scryfall.io/card-symbols/S.svg", // Snow
  X: "https://svgs.scryfall.io/card-symbols/X.svg",

  // Numbers
  0: "https://svgs.scryfall.io/card-symbols/0.svg",
  1: "https://svgs.scryfall.io/card-symbols/1.svg",
  2: "https://svgs.scryfall.io/card-symbols/2.svg",
  3: "https://svgs.scryfall.io/card-symbols/3.svg",
  4: "https://svgs.scryfall.io/card-symbols/4.svg",
  5: "https://svgs.scryfall.io/card-symbols/5.svg",
  6: "https://svgs.scryfall.io/card-symbols/6.svg",
  7: "https://svgs.scryfall.io/card-symbols/7.svg",
  8: "https://svgs.scryfall.io/card-symbols/8.svg",
  9: "https://svgs.scryfall.io/card-symbols/9.svg",
  10: "https://svgs.scryfall.io/card-symbols/10.svg",
  11: "https://svgs.scryfall.io/card-symbols/11.svg",
  12: "https://svgs.scryfall.io/card-symbols/12.svg",
  13: "https://svgs.scryfall.io/card-symbols/13.svg",
  14: "https://svgs.scryfall.io/card-symbols/14.svg",
  15: "https://svgs.scryfall.io/card-symbols/15.svg",
  16: "https://svgs.scryfall.io/card-symbols/16.svg",
  17: "https://svgs.scryfall.io/card-symbols/17.svg",
  18: "https://svgs.scryfall.io/card-symbols/18.svg",
  19: "https://svgs.scryfall.io/card-symbols/19.svg",
  20: "https://svgs.scryfall.io/card-symbols/20.svg",

  // Hybrid
  "W/U": "https://svgs.scryfall.io/card-symbols/WU.svg",
  "W/B": "https://svgs.scryfall.io/card-symbols/WB.svg",
  "U/B": "https://svgs.scryfall.io/card-symbols/UB.svg",
  "U/R": "https://svgs.scryfall.io/card-symbols/UR.svg",
  "B/R": "https://svgs.scryfall.io/card-symbols/BR.svg",
  "B/G": "https://svgs.scryfall.io/card-symbols/BG.svg",
  "R/G": "https://svgs.scryfall.io/card-symbols/RG.svg",
  "R/W": "https://svgs.scryfall.io/card-symbols/RW.svg",
  "G/W": "https://svgs.scryfall.io/card-symbols/GW.svg",
  "G/U": "https://svgs.scryfall.io/card-symbols/GU.svg",

  // 2-color hybrids
  "2/W": "https://svgs.scryfall.io/card-symbols/2W.svg",
  "2/U": "https://svgs.scryfall.io/card-symbols/2U.svg",
  "2/B": "https://svgs.scryfall.io/card-symbols/2B.svg",
  "2/R": "https://svgs.scryfall.io/card-symbols/2R.svg",
  "2/G": "https://svgs.scryfall.io/card-symbols/2G.svg",

  // Phyrexian
  "W/P": "https://svgs.scryfall.io/card-symbols/WP.svg",
  "U/P": "https://svgs.scryfall.io/card-symbols/UP.svg",
  "B/P": "https://svgs.scryfall.io/card-symbols/BP.svg",
  "R/P": "https://svgs.scryfall.io/card-symbols/RP.svg",
  "G/P": "https://svgs.scryfall.io/card-symbols/GP.svg",

  // Special symbols
  T: "https://svgs.scryfall.io/card-symbols/T.svg",  // Tap
  Q: "https://svgs.scryfall.io/card-symbols/Q.svg",  // Untap
  E: "https://svgs.scryfall.io/card-symbols/E.svg",  // Energy
  P: "https://svgs.scryfall.io/card-symbols/P.svg",  // Generic Phyrexian
  A: "https://svgs.scryfall.io/card-symbols/A.svg",  // Acorn
  CHAOS: "https://svgs.scryfall.io/card-symbols/CHAOS.svg",
};

function renderManaCost(manaCost: string | undefined) {
  if (manaCost === null || manaCost === undefined || manaCost.trim() === "") return "No casting cost";

  const symbols = manaCost.match(/{[^}]+}/g) || [];

  // Strip `{}` and keep original
  const parsed = symbols.map(sym => {
    const key = sym.replace(/[{}]/g, "");
    return { raw: sym, key };
  });

  // Define sort order
  const colorOrder = ['W', 'U', 'B', 'R', 'G'];
  const sortKey = (symbol: string): number => {
    // Generic mana (0–20)
    if (/^\d+$/.test(symbol)) return parseInt(symbol, 10);

    // Special variables
    if (symbol === 'X') return 100;
    if (symbol === 'Y') return 101;
    if (symbol === 'Z') return 102;

    // Colorless
    if (symbol === 'C') return 103;

    // Mono-colored mana (WUBRG)
    if (colorOrder.includes(symbol)) return 104 + colorOrder.indexOf(symbol);

    // Hybrid mana
    if (/^[WUBRG]\/[WUBRG]$/.test(symbol)) return 110;

    // 2-color hybrid
    if (/^2\/[WUBRG]$/.test(symbol)) return 111;

    // Phyrexian mana
    if (/^[WUBRG]\/P$/.test(symbol)) return 112;

    // Snow, energy, etc.
    return 120;
  };

  // Sort using sortKey
  const sorted = parsed.sort((a, b) => sortKey(a.key) - sortKey(b.key));

  // Render
  return sorted.map((sym, idx) => {
    const src = manaSymbolMap[sym.key];
    return src ? (
      <img
        key={idx}
        src={src}
        alt={sym.key}
        className="inline w-5 h-5 mx-0.5 align-middle"
      />
    ) : (
      <span key={idx}>{sym.raw}</span>
    );
  });
}

interface MTGCard {
  name: string
  mana_cost: string
  cmc: number
  colors: string[]
  type_line: string
  set: string
  set_name: string
  oracle_text: string
  image_uris?: {
    normal: string
    art_crop: string
  }
}

interface CubeData {
  cards: MTGCard[]
}

type GameMode = "infinite" | "5-card" | "10-card"

interface GameStats {
  currentScore: number
  cardsCompleted: number
  totalCards: number
  highScore: number
}

const sessionHighScores = {
  "5-card": 0,
  "10-card": 0,
}

export default function MTGCubeGame() {
  const [cubeId, setCubeId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cubeData, setCubeData] = useState<CubeData | null>(null)
  const [selectedCard, setSelectedCard] = useState<MTGCard | null>(null)
  const [currentHint, setCurrentHint] = useState(0)
  const [maxHintRevealed, setMaxHintRevealed] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [guess, setGuess] = useState("")
  const [guessesUsed, setGuessesUsed] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [lastGuess, setLastGuess] = useState("")
  const [showConfetti, setShowConfetti] = useState(false)
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [gameMode, setGameMode] = useState<GameMode>("infinite")
  const [gameStats, setGameStats] = useState<GameStats>({
    currentScore: 0,
    cardsCompleted: 0,
    totalCards: 0,
    highScore: 0,
  })

  const MAX_GUESSES = 7
  const hints = ["Mana Value", "Color Identity", "Casting Cost", "Type", "Set", "Oracle Text", "Card Art"]

  const filteredCards = useMemo(() => {
    if (!cubeData?.cards || !guess.trim()) return []

    const searchTerm = guess.toLowerCase()
    return cubeData.cards.filter((card) => card.name.toLowerCase().includes(searchTerm)).slice(0, 10) // Limit to 10 results for performance
  }, [cubeData?.cards, guess])

  const fetchCubeData = async () => {
    if (!cubeId.trim()) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/cube/${cubeId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Cube ID "${cubeId}" not found. Please check the ID and try again.`)
        } else if (response.status === 500) {
          throw new Error("Server error occurred. Please try again later.")
        } else {
          throw new Error(`Failed to load cube (${response.status}). Please check the ID and try again.`)
        }
      }

      const data = await response.json()

      if (!data.cards || data.cards.length === 0) {
        throw new Error("No cards found in this cube. Please check the Cube ID.")
      }

      setCubeData(data)
      setGameStarted(false)
      setSelectedCard(null)
      setCurrentHint(0)
      setMaxHintRevealed(0)
      setShowAnswer(false)
      setGuess("")
      setGuessesUsed(0)
      setGameOver(false)
      setIsCorrect(false)
      setLastGuess("")
      setShowConfetti(false)
      setGameStats({
        currentScore: 0,
        cardsCompleted: 0,
        totalCards: gameMode === "5-card" ? 5 : gameMode === "10-card" ? 10 : 0,
        highScore: sessionHighScores[gameMode as "5-card" | "10-card"] || 0,
      })
    } catch (error) {
      console.error("Error fetching cube:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred while loading the cube.")
      setCubeData(null)
    } finally {
      setLoading(false)
    }
  }

  const startNewGame = (mode: GameMode = gameMode) => {
    if (!cubeData?.cards.length) return

    setGameMode(mode)
    const randomIndex = Math.floor(Math.random() * cubeData.cards.length)
    setSelectedCard(cubeData.cards[randomIndex])
    setGameStarted(true)
    setIsPanelCollapsed(true) // Auto-collapse panel when game starts to save screen space
    setCurrentHint(0)
    setMaxHintRevealed(0)
    setShowAnswer(false)
    setGuess("")
    setGuessesUsed(0)
    setGameOver(false)
    setIsCorrect(false)
    setLastGuess("")
    setShowConfetti(false)

    if (mode !== "infinite") {
      const totalCards = mode === "5-card" ? 5 : 10
      setGameStats({
        currentScore: 0,
        cardsCompleted: 0,
        totalCards,
        highScore: sessionHighScores[mode as "5-card" | "10-card"] || 0,
      })
    }
  }

  const nextCard = () => {
    if (gameMode === "infinite") {
      startNewGame("infinite")
      return
    }

    const newCardsCompleted = gameStats.cardsCompleted + 1

    if (newCardsCompleted >= gameStats.totalCards) {
      // Game mode completed
      const finalScore = gameStats.currentScore
      const currentHighScore = sessionHighScores[gameMode as "5-card" | "10-card"]

      if (finalScore > currentHighScore) {
        setSessionHighScores((prev) => ({
          ...prev,
          [gameMode]: finalScore,
        }))
      }

      setGameStarted(false)
      setGameStats((prev) => ({ ...prev, cardsCompleted: newCardsCompleted }))
    } else {
      // Continue to next card
      const randomIndex = Math.floor(Math.random() * cubeData!.cards.length)
      setSelectedCard(cubeData!.cards[randomIndex])
      setCurrentHint(0)
      setMaxHintRevealed(0)
      setShowAnswer(false)
      setGuess("")
      setGuessesUsed(0)
      setGameOver(false)
      setIsCorrect(false)
      setLastGuess("")
      setShowConfetti(false)
      setGameStats((prev) => ({ ...prev, cardsCompleted: newCardsCompleted }))
    }
  }

  const nextHint = () => {
    if (currentHint >= hints.length - 1 || gameOver) return

    if (currentHint >= maxHintRevealed) {
      const newGuessesUsed = guessesUsed + 1
      setGuessesUsed(newGuessesUsed)

      if (newGuessesUsed >= MAX_GUESSES) {
        setGameOver(true)
        setShowAnswer(true)
        return
      }

      setMaxHintRevealed(currentHint + 1)
    }

    setCurrentHint(currentHint + 1)
  }

  const goToPreviousHint = () => {
    if (currentHint > 0) {
      setCurrentHint(currentHint - 1)
    }
  }

  const goToNextHint = () => {
    if (currentHint < maxHintRevealed) {
      setCurrentHint(currentHint + 1)
    }
  }

  const makeGuess = (cardName: string) => {
    if (gameOver) return

    const newGuessesUsed = guessesUsed + 1
    setGuessesUsed(newGuessesUsed)
    setLastGuess(cardName)

    if (cardName.toLowerCase() === selectedCard?.name.toLowerCase()) {
      setIsCorrect(true)
      setShowAnswer(true)
      setGameOver(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)

      if (gameMode !== "infinite") {
        const pointsEarned = MAX_GUESSES - guessesUsed
        setGameStats((prev) => ({
          ...prev,
          currentScore: prev.currentScore + pointsEarned,
        }))
      }
    } else if (newGuessesUsed >= MAX_GUESSES) {
      setGameOver(true)
      setShowAnswer(true)
      setIsCorrect(false)
    }

    setGuess("")
    setShowSuggestions(false)
  }

  const revealAnswer = () => {
    setShowAnswer(true)
    setGameOver(true)
  }

  const getRedactedText = (text: string, cardName: string) => {
    if (!text || !cardName) return text

    const nameWords = cardName
      .toLowerCase()
      .split(/[\s,]+/)
      .filter((word) => word.length > 2)
    let redactedText = text

    nameWords.forEach((word) => {
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
      redactedText = redactedText.replace(regex, "[REDACTED]")
    })

    return redactedText
  }

  const getRedactedTypeLine = (typeLine: string, cardName: string) => {
    if (!typeLine || !cardName) return typeLine

    if (typeLine.toLowerCase().includes("planeswalker")) {
      const nameWords = cardName.toLowerCase().split(/[\s,]+/)
      let redactedType = typeLine

      nameWords.forEach((word) => {
        if (word.length > 2) {
          const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
          redactedType = redactedType.replace(regex, "[REDACTED]")
        }
      })

      return redactedType
    }

    return getRedactedText(typeLine, cardName)
  }

  const renderHint = () => {
    if (!selectedCard) return null

    switch (currentHint) {
      case 0: // Mana Value
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Mana Value:</p>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {selectedCard.cmc}
            </Badge>
          </div>
        )
      case 1: // Colors
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Colors:</p>
            <div className="flex gap-2 justify-center">
              {selectedCard.colors.length === 0 ? (
                <Badge variant="outline">Colorless</Badge>
              ) : (
                selectedCard.colors.map((color) => (
                  <Badge key={color} variant="secondary">
                    {color}
                  </Badge>
                ))
              )}
            </div>
          </div>
        )
      case 2: // Casting Cost
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Casting Cost:</p>
            <Badge variant="secondary" className="text-lg px-4 py-2 font-mono">
               {renderManaCost(selectedCard.mana_cost)}
            </Badge>
          </div>
        )
      case 3: // Type
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Type Line:</p>
            <Badge variant="secondary" className="px-4 py-2">
              {getRedactedTypeLine(selectedCard.type_line, selectedCard.name)}
            </Badge>
          </div>
        )
      case 4: // Set
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Set:</p>
            <Badge variant="secondary" className="px-4 py-2">
              {selectedCard.set_name} ({selectedCard.set.toUpperCase()})
            </Badge>
          </div>
        )
      case 5: // Oracle Text
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Oracle Text:</p>
            <div className="bg-muted p-3 rounded-lg max-w-md mx-auto">
              <p className="text-sm leading-relaxed">
                {getRedactedText(selectedCard.oracle_text, selectedCard.name) || "No oracle text"}
              </p>
            </div>
          </div>
        )
      case 6: // Card Art
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">Card Art:</p>
            {selectedCard.image_uris?.art_crop && (
              <img
                src={selectedCard.image_uris.art_crop || "/placeholder.svg"}
                alt="Card art"
                className="mx-auto rounded-lg max-w-xs"
              />
            )}
          </div>
        )
      default:
        return null
    }
  }

  const setSessionHighScores = (newScores: any) => {
    // This function is a placeholder for setting session high scores
    // In a real application, you would use a state management library or context to handle this
    console.log("Setting session high scores:", newScores)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              >
                🎉
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-4xl font-bold text-foreground">MTG Cube Guesser</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 bg-transparent">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>How to Play MTG Cube Guesser</DialogTitle>
                  <DialogDescription>Learn the rules and gameplay mechanics</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2">🎯 Objective</h3>
                    <p>
                      Guess the randomly selected Magic: The Gathering card from a Cube Cobra cube using progressive
                      hints.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">🎮 How to Play</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Enter a valid Cube Cobra ID and click "Load Cube"</li>
                      <li>Click "Start Game" to randomly select a card from the cube</li>
                      <li>Use hints to narrow down your guess (each hint after the first costs a guess)</li>
                      <li>Search and select your guess from the cube's card list</li>
                      <li>Win by guessing correctly or lose after 7 incorrect guesses</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">💡 Hint System</h3>
                    <p className="mb-2">Hints are revealed in this order:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>
                        <strong>Mana Value:</strong> The converted mana cost (free)
                      </li>
                      <li>
                        <strong>Colors:</strong> The card's color identity
                      </li>
                      <li>
                        <strong>Casting Cost:</strong> The exact mana symbols required
                      </li>
                      <li>
                        <strong>Type:</strong> Card type (creature, instant, etc.)
                      </li>
                      <li>
                        <strong>Set:</strong> Which Magic set the card is from
                      </li>
                      <li>
                        <strong>Oracle Text:</strong> The card's rules text (names redacted)
                      </li>
                      <li>
                        <strong>Card Art:</strong> The artwork from the card
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">⚡ Guess System</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        You have <strong>7 total guesses</strong> before the game ends
                      </li>
                      <li>The first hint (Mana Value) is free</li>
                      <li>Each additional hint costs 1 guess</li>
                      <li>Each wrong card guess costs 1 guess</li>
                      <li>Use the search box to find cards from the loaded cube</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">🏆 Winning & Losing</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>Win:</strong> Guess the correct card name before running out of guesses
                      </li>
                      <li>
                        <strong>Lose:</strong> Use all 7 guesses without finding the correct card
                      </li>
                      <li>You can reveal the answer at any time to end the game</li>
                    </ul>
                  </div>

                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Tip:</strong> Card names in oracle text and type lines are replaced with [REDACTED] to
                      prevent spoilers!
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-muted-foreground">Enter a Cube Cobra ID to start guessing cards from that cube!</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Load Cube</CardTitle>
                {!isPanelCollapsed && (
                  <CardDescription>Enter a Cube Cobra ID to load the cube and start playing</CardDescription>
                )}
              </div>
              {gameStarted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                  className="gap-2"
                >
                  {isPanelCollapsed ? (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show Cube Options
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide Panel
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>

          {(!gameStarted || !isPanelCollapsed) && (
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  className="bg-white"
                  placeholder="Enter Cube Cobra ID (e.g., 11sg)"
                  value={cubeId}
                  onChange={(e) => setCubeId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchCubeData()}
                  disabled={loading}
                />
                <Button onClick={fetchCubeData} disabled={loading || !cubeId.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load Cube"
                  )}
                </Button>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="text-destructive-foreground">
                      <p className="font-medium">Failed to load cube</p>
                      <p className="text-sm mt-1">{error}</p>
                      <p className="text-xs mt-2 text-muted-foreground">
                        Make sure you're using a valid Cube Cobra ID from a public cube.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loading && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <div>
                      <p className="font-medium">Loading cube...</p>
                      <p className="text-sm text-muted-foreground">Fetching cards from Cube Cobra</p>
                    </div>
                  </div>
                </div>
              )}

              {cubeData && !loading && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Cube loaded successfully!</p>
                      <p className="text-sm text-muted-foreground">{cubeData.cards.length} cards available</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="font-medium">Choose Game Mode:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        onClick={() => startNewGame("infinite")}
                        className="gap-2 h-auto p-4 flex-col"
                        variant={gameMode === "infinite" ? "default" : "outline"}
                      >
                        <Shuffle className="h-4 w-4" />
                        <div className="text-center">
                          <div className="font-medium">Infinite Mode</div>
                          <div className="text-xs opacity-75">Keep playing forever</div>
                        </div>
                      </Button>

                      <Button
                        onClick={() => startNewGame("5-card")}
                        className="gap-2 h-auto p-4 flex-col"
                        variant={gameMode === "5-card" ? "default" : "outline"}
                      >
                        <Shuffle className="h-4 w-4" />
                        <div className="text-center">
                          <div className="font-medium">5 Card Challenge</div>
                          <div className="text-xs opacity-75">High Score: {sessionHighScores["5-card"]}</div>
                        </div>
                      </Button>

                      <Button
                        onClick={() => startNewGame("10-card")}
                        className="gap-2 h-auto p-4 flex-col"
                        variant={gameMode === "10-card" ? "default" : "outline"}
                      >
                        <Shuffle className="h-4 w-4" />
                        <div className="text-center">
                          <div className="font-medium">10 Card Challenge</div>
                          <div className="text-xs opacity-75">High Score: {sessionHighScores["10-card"]}</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {gameStarted && gameMode !== "infinite" && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <Badge variant="secondary" className="text-sm">
                    Card {gameStats.cardsCompleted + 1} / {gameStats.totalCards}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    Score: {gameStats.currentScore}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    High Score: {gameStats.highScore}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {gameMode === "5-card" ? "5 Card Challenge" : "10 Card Challenge"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {gameStarted && selectedCard && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Hints
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {currentHint + 1} / {hints.length}
                    </Badge>
                    <Badge variant={guessesUsed >= MAX_GUESSES - 2 ? "destructive" : "secondary"}>
                      {guessesUsed} / {MAX_GUESSES} guesses
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="min-h-[120px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                  {renderHint()}
                </div>

                {maxHintRevealed > 0 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button onClick={goToPreviousHint} disabled={currentHint === 0} variant="outline" size="sm">
                      ← Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      {hints[currentHint]} ({currentHint + 1}/{maxHintRevealed + 1})
                    </span>
                    <Button
                      onClick={goToNextHint}
                      disabled={currentHint >= maxHintRevealed}
                      variant="outline"
                      size="sm"
                    >
                      Next →
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={nextHint}
                    disabled={currentHint >= hints.length - 1 || gameOver}
                    variant="secondary"
                    className="flex-1"
                  >
                    {currentHint >= maxHintRevealed && !gameOver
                      ? `Next Hint (${MAX_GUESSES - guessesUsed - 1} left)`
                      : `Next Hint`}
                    {hints[currentHint + 1] && ` - ${hints[currentHint + 1]}`}
                  </Button>
                  <Button
                    onClick={revealAnswer}
                    variant="outline"
                    className="gap-2 bg-transparent"
                    disabled={gameOver && showAnswer}
                  >
                    {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showAnswer ? "Hide" : "Reveal"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Guess</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!gameOver && lastGuess && !isCorrect && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-black">
                      <span className="font-medium">"{lastGuess}"</span> is not correct. Try again!
                    </p>
                  </div>
                )}

                {!gameOver && (
                  <div className="relative">
                    <Input
                      placeholder="Type to search for a card..."
                      value={guess}
                      onChange={(e) => {
                        setGuess(e.target.value)
                        setShowSuggestions(e.target.value.trim().length > 0)
                      }}
                      onFocus={() => setShowSuggestions(guess.trim().length > 0)}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 150)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && filteredCards.length > 0) {
                          makeGuess(filteredCards[0].name)
                        }
                        if (e.key === "Escape") {
                          setShowSuggestions(false)
                        }
                      }}
                      disabled={gameOver}
                      className="text-sm text-black bg-white"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                    {showSuggestions && filteredCards.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredCards.map((card, index) => (
                          <button
                            key={card.name}
                            className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground border-b border-border last:border-b-0 text-sm"
                            onClick={() => makeGuess(card.name)}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {card.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {showSuggestions && guess.trim().length > 0 && filteredCards.length === 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-3">
                        <p className="text-sm text-muted-foreground">No cards found matching "{guess}"</p>
                      </div>
                    )}
                  </div>
                )}

                {showAnswer && (
                  <div className="space-y-4">
                    <Button
                      onClick={gameMode === "infinite" ? () => startNewGame("infinite") : nextCard}
                      className="w-full gap-2"
                    >
                      <Shuffle className="h-4 w-4" />
                      {gameMode === "infinite"
                        ? "New Card"
                        : gameStats.cardsCompleted + 1 >= gameStats.totalCards
                          ? "Finish Game"
                          : "Next Card"}
                    </Button>

                    <div
                      className={`p-4 rounded-lg border ${
                        isCorrect
                          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                          : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                      }`}
                    >
                      <p
                        className={`font-medium ${
                          isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                        }`}
                      >
                        {isCorrect ? "🎉 Congratulations! You got it right!" : "💔 Game Over! The answer was:"}
                      </p>
                      <p className="text-lg font-bold text-foreground">{selectedCard.name}</p>
                    </div>

                    {selectedCard.image_uris?.normal && (
                      <img
                        src={selectedCard.image_uris.normal || "/placeholder.svg"}
                        alt={selectedCard.name}
                        className="mx-auto rounded-lg max-w-full"
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!gameStarted && gameMode !== "infinite" && gameStats.cardsCompleted > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {gameMode === "5-card" ? "5 Card Challenge" : "10 Card Challenge"} Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="space-y-2">
                <p className="text-2xl font-bold">Final Score: {gameStats.currentScore}</p>
                <p className="text-muted-foreground">
                  {gameStats.currentScore > sessionHighScores[gameMode as "5-card" | "10-card"]
                    ? "🎉 New High Score!"
                    : `High Score: ${sessionHighScores[gameMode as "5-card" | "10-card"]}`}
                </p>
              </div>
              <Button onClick={() => startNewGame(gameMode)} className="gap-2">
                <Shuffle className="h-4 w-4" />
                Play Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
