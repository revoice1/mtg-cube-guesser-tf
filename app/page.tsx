"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shuffle, Eye, EyeOff, Search, HelpCircle, ChevronDown, ChevronUp, Trophy, BarChart3, Timer } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useLocalStorage } from "@/lib/hooks"

// — Inserted for mana symbol support —
const manaSymbolMap: Record<string, string> = {
  // Mono
  w: "https://svgs.scryfall.io/card-symbols/W.svg",
  u: "https://svgs.scryfall.io/card-symbols/U.svg",
  b: "https://svgs.scryfall.io/card-symbols/B.svg",
  r: "https://svgs.scryfall.io/card-symbols/R.svg",
  g: "https://svgs.scryfall.io/card-symbols/G.svg",
  c: "https://svgs.scryfall.io/card-symbols/C.svg",
  s: "https://svgs.scryfall.io/card-symbols/S.svg", // Snow
  x: "https://svgs.scryfall.io/card-symbols/X.svg",

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
  "w-u": "https://svgs.scryfall.io/card-symbols/WU.svg",
  "w-b": "https://svgs.scryfall.io/card-symbols/WB.svg",
  "u-b": "https://svgs.scryfall.io/card-symbols/UB.svg",
  "u-r": "https://svgs.scryfall.io/card-symbols/UR.svg",
  "b-r": "https://svgs.scryfall.io/card-symbols/BR.svg",
  "b-g": "https://svgs.scryfall.io/card-symbols/BG.svg",
  "g-r": "https://svgs.scryfall.io/card-symbols/RG.svg",
  "r-w": "https://svgs.scryfall.io/card-symbols/RW.svg",
  "g-w": "https://svgs.scryfall.io/card-symbols/GW.svg",
  "g-u": "https://svgs.scryfall.io/card-symbols/GU.svg",

  // 2-color hybrids
  "2/w": "https://svgs.scryfall.io/card-symbols/2W.svg",
  "2/u": "https://svgs.scryfall.io/card-symbols/2U.svg",
  "2/b": "https://svgs.scryfall.io/card-symbols/2B.svg",
  "2/r": "https://svgs.scryfall.io/card-symbols/2R.svg",
  "2/g": "https://svgs.scryfall.io/card-symbols/2G.svg",

  // Phyrexian
  "w-p": "https://svgs.scryfall.io/card-symbols/WP.svg",
  "u-p": "https://svgs.scryfall.io/card-symbols/UP.svg",
  "b-p": "https://svgs.scryfall.io/card-symbols/BP.svg",
  "r-p": "https://svgs.scryfall.io/card-symbols/RP.svg",
  "g-p": "https://svgs.scryfall.io/card-symbols/GP.svg",

  // Special symbols
  t: "https://svgs.scryfall.io/card-symbols/T.svg",  // Tap
  q: "https://svgs.scryfall.io/card-symbols/Q.svg",  // Untap
  e: "https://svgs.scryfall.io/card-symbols/E.svg",  // Energy
  p: "https://svgs.scryfall.io/card-symbols/P.svg",  // Generic Phyrexian
  a: "https://svgs.scryfall.io/card-symbols/A.svg",  // Acorn
  CHAOS: "https://svgs.scryfall.io/card-symbols/CHAOS.svg",
};

function renderManaCost(manaCost: string[] | undefined): JSX.Element | string {
  // Handle missing or empty cost arrays
  if (
  !manaCost ||                                 // null or undefined
  manaCost.length === 0 ||                     // []
  manaCost.every(s => s.trim() === "")         // [""] or ["", "  ", ...]
  ){
    return "No casting cost";
  }

  // Parse the symbols—assuming the array contains strings like "{R}", "{U}", "3", etc.
  // Normalize so each item is without braces if present
  const parsed = manaCost.map(sym => {
    const key = sym.startsWith("{") && sym.endsWith("}")
      ? sym.slice(1, -1)
      : sym;
    return key;
  });

  // Sort in canonical order: generic numbers first, then WUBRG, etc.
  const colorOrder = ['w', 'u', 'b', 'r', 'g'];
  const getSortValue = (sym: string): number => {
    if (/^\d+$/.test(sym)) return parseInt(sym, 10);           // Generic numbers
    if (sym === 'x') return 100;                               // Variable X
    if (sym === 'c') return 101;                               // Colorless
    if (colorOrder.includes(sym)) return 102 + colorOrder.indexOf(sym); // Mono-colored
    if (/^[wubrg]\/[wubrg]$/.test(sym)) return 110;               // Hybrid
    if (/^2\/[wubrg]$/.test(sym)) return 111;                    // Two-color hybrid
    if (/^[wubrg]\/P$/.test(sym)) return 112;                    // Phyrexian
    return 120;                                                  // Others (S, T, etc.)
  };

  const sortedSymbols = parsed.sort((a, b) => getSortValue(a) - getSortValue(b));

  // Render the sorted symbols using your icon map
  return (
    <>
      {sortedSymbols.map((key, idx) => {
        const src = manaSymbolMap[key.toLowerCase()];
        return src ? (
          <img
            key={idx}
            src={src}
            alt={key}
            className="inline w-5 h-5 mx-0.5 align-middle"
          />
        ) : (
          <span key={idx}>{`{${key}}`}</span>
        );
      })}
    </>
  );
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

type GameMode = "infinite" | "5-card" | "10-card" | "timed" | "hardcore"

interface GameStats {
  currentScore: number
  cardsCompleted: number
  totalCards: number
  highScore: number
}

interface HighScores {
  "5-card": number
  "10-card": number
  "timed": number
  "hardcore": number
}

interface Statistics {
  totalGamesPlayed: number
  totalCardsGuessed: number
  averageGuessesPerCard: number
  bestStreak: number
  currentStreak: number
  favoriteMode: GameMode | null
}


export default function MTGCubeGame() {
  const [cubeId, setCubeId] = useLocalStorage("lastCubeId", "")
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

  const [highScores, setHighScores] = useLocalStorage<HighScores>("highScores", {
    "5-card": 0,
    "10-card": 0,
    "timed": 0,
    "hardcore": 0,
  })

  const [statistics, setStatistics] = useLocalStorage<Statistics>("gameStatistics", {
    totalGamesPlayed: 0,
    totalCardsGuessed: 0,
    averageGuessesPerCard: 0,
    bestStreak: 0,
    currentStreak: 0,
    favoriteMode: null,
  })

  const [timeLeft, setTimeLeft] = useState(60)
  const [timerActive, setTimerActive] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [guessHistory, setGuessHistory] = useState<string[]>([])

  const MAX_GUESSES = 7
  const hints = ["Mana Value", "Color Identity", "Casting Cost", "Type", "Set", "Oracle Text", "Card Art"]

  // Timer for timed mode
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerActive && timeLeft > 0 && !gameOver) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameOver(true)
            setShowAnswer(true)
            setTimerActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft, gameOver])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameStarted && !gameOver && selectedCard) {
        if (e.key === 'ArrowRight' && currentHint < hints.length - 1) {
          nextHint()
        } else if (e.key === 'ArrowLeft' && currentHint > 0 && currentHint <= maxHintRevealed) {
          goToPreviousHint()
        } else if (e.key === 'r' && e.ctrlKey) {
          e.preventDefault()
          revealAnswer()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameStarted, gameOver, currentHint, maxHintRevealed, selectedCard])

  const filteredCards = useMemo(() => {
    if (!cubeData?.cards || !guess.trim()) return []

    const searchTerm = guess.toLowerCase().trim()
    const exactMatch = cubeData.cards.filter((card) => card.name.toLowerCase() === searchTerm)
    const startsWithMatch = cubeData.cards.filter((card) =>
      card.name.toLowerCase().startsWith(searchTerm) && !exactMatch.includes(card)
    )
    const includesMatch = cubeData.cards.filter((card) =>
      card.name.toLowerCase().includes(searchTerm) &&
      !exactMatch.includes(card) &&
      !startsWithMatch.includes(card)
    )

    return [...exactMatch, ...startsWithMatch, ...includesMatch].slice(0, 15)
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
      const totalCards = gameMode === "5-card" ? 5 :
                          gameMode === "10-card" ? 10 :
                          gameMode === "timed" ? 999 :
                          gameMode === "hardcore" ? 3 : 0
      setGameStats({
        currentScore: 0,
        cardsCompleted: 0,
        totalCards,
        highScore: highScores[gameMode as keyof HighScores] || 0,
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
    setIsPanelCollapsed(true)
    setCurrentHint(0)
    setMaxHintRevealed(0)
    setShowAnswer(false)
    setGuess("")
    setGuessesUsed(0)
    setGameOver(false)
    setIsCorrect(false)
    setLastGuess("")
    setShowConfetti(false)
    setGuessHistory([])
    setCurrentStreak(0)

    if (mode === "timed") {
      setTimeLeft(60)
      setTimerActive(true)
    } else {
      setTimerActive(false)
    }

    if (mode !== "infinite") {
      const totalCards = mode === "5-card" ? 5 :
                        mode === "10-card" ? 10 :
                        mode === "timed" ? 999 :
                        mode === "hardcore" ? 3 : 0
      setGameStats({
        currentScore: 0,
        cardsCompleted: 0,
        totalCards,
        highScore: highScores[mode as keyof HighScores] || 0,
      })
    }

    // Update statistics
    setStatistics(prev => ({
      ...prev,
      totalGamesPlayed: prev.totalGamesPlayed + 1,
      favoriteMode: mode,
    }))
  }

  const nextCard = () => {
    if (gameMode === "infinite") {
      startNewGame("infinite")
      return
    }

    const newCardsCompleted = gameStats.cardsCompleted + 1

    if (gameMode === "timed" && timeLeft > 0) {
      // Continue in timed mode
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
      setGuessHistory([])
      setGameStats((prev) => ({ ...prev, cardsCompleted: newCardsCompleted }))
      return
    }

    if (newCardsCompleted >= gameStats.totalCards || (gameMode === "timed" && timeLeft <= 0)) {
      // Game mode completed
      const finalScore = gameStats.currentScore
      const currentHighScore = highScores[gameMode as keyof HighScores] || 0

      if (finalScore > currentHighScore) {
        setHighScores((prev) => ({
          ...prev,
          [gameMode]: finalScore,
        }))
      }

      setGameStarted(false)
      setTimerActive(false)
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
      setGuessHistory([])
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
    setGuessHistory(prev => [...prev, cardName])

    // Check if guess is correct (with fuzzy matching)
    const isExactMatch = cardName.toLowerCase() === selectedCard?.name.toLowerCase()
    const isCloseMatch = cardName.toLowerCase().replace(/[^a-z0-9]/g, '') ===
                         selectedCard?.name.toLowerCase().replace(/[^a-z0-9]/g, '')

    if (isExactMatch || isCloseMatch) {
      setIsCorrect(true)
      setShowAnswer(true)
      setGameOver(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)

      // Update streak
      const newStreak = currentStreak + 1
      setCurrentStreak(newStreak)

      // Update statistics
      setStatistics(prev => {
        const newTotal = prev.totalCardsGuessed + 1
        const totalGuesses = prev.averageGuessesPerCard * prev.totalCardsGuessed + newGuessesUsed
        return {
          ...prev,
          totalCardsGuessed: newTotal,
          averageGuessesPerCard: totalGuesses / newTotal,
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
        }
      })

      if (gameMode !== "infinite") {
        const pointsEarned = gameMode === "hardcore" ?
          (newGuessesUsed === 1 ? 10 : newGuessesUsed === 2 ? 5 : 2) :
          (MAX_GUESSES - guessesUsed)

        if (gameMode === "timed") {
          const timeBonus = Math.floor(timeLeft / 10)
          setGameStats((prev) => ({
            ...prev,
            currentScore: prev.currentScore + pointsEarned + timeBonus,
          }))
        } else {
          setGameStats((prev) => ({
            ...prev,
            currentScore: prev.currentScore + pointsEarned,
          }))
        }
      }
    } else if (newGuessesUsed >= (gameMode === "hardcore" ? 3 : MAX_GUESSES)) {
      setGameOver(true)
      setShowAnswer(true)
      setIsCorrect(false)
      setCurrentStreak(0)
      setStatistics(prev => ({ ...prev, currentStreak: 0 }))
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
            <Badge variant="secondary" className="text-lg px-4 py-2 font-mono">
              {selectedCard.cmc}
            </Badge>
          </div>
        )
      case 1: // Color Identity
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Color Identity:</p>
            <Badge variant="secondary" className="text-lg px-4 py-2 font-mono">
              {selectedCard.colors.length === 0 ? renderManaCost(["c"]) : renderManaCost(selectedCard.colors)}
            </Badge>
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
            <Badge variant="secondary" className="text-lg px-4 py-2 font-mono">
              {getRedactedTypeLine(selectedCard.type_line, selectedCard.name)}
            </Badge>
          </div>
        )
      case 4: // Set
        return (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Set:</p>
            <Badge variant="secondary" className="text-lg px-4 py-2 font-mono">
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
  } // End of renderHint

  // Component return
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
                    <h3 className="font-semibold mb-2">⌨️ Keyboard Shortcuts</h3>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>Arrow Right:</strong> Next hint (costs a guess)
                      </li>
                      <li>
                        <strong>Arrow Left:</strong> Previous hint (free navigation)
                      </li>
                      <li>
                        <strong>Enter:</strong> Submit guess (in search box)
                      </li>
                      <li>
                        <strong>Ctrl+R:</strong> Reveal answer
                      </li>
                    </ul>
                  </div>
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                        <Trophy className="h-4 w-4" />
                        <div className="text-center">
                          <div className="font-medium">5 Card Challenge</div>
                          <div className="text-xs opacity-75">High Score: {highScores["5-card"]}</div>
                        </div>
                      </Button>

                      <Button
                        onClick={() => startNewGame("10-card")}
                        className="gap-2 h-auto p-4 flex-col"
                        variant={gameMode === "10-card" ? "default" : "outline"}
                      >
                        <Trophy className="h-4 w-4" />
                        <div className="text-center">
                          <div className="font-medium">10 Card Challenge</div>
                          <div className="text-xs opacity-75">High Score: {highScores["10-card"]}</div>
                        </div>
                      </Button>

                      <Button
                        onClick={() => startNewGame("timed")}
                        className="gap-2 h-auto p-4 flex-col"
                        variant={gameMode === "timed" ? "default" : "outline"}
                      >
                        <Timer className="h-4 w-4" />
                        <div className="text-center">
                          <div className="font-medium">Timed Mode</div>
                          <div className="text-xs opacity-75">60 seconds • High: {highScores["timed"]}</div>
                        </div>
                      </Button>

                      <Button
                        onClick={() => startNewGame("hardcore")}
                        className="gap-2 h-auto p-4 flex-col"
                        variant={gameMode === "hardcore" ? "default" : "outline"}
                      >
                        <BarChart3 className="h-4 w-4" />
                        <div className="text-center">
                          <div className="font-medium">Hardcore</div>
                          <div className="text-xs opacity-75">3 lives • High: {highScores["hardcore"]}</div>
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
                  {gameMode !== "timed" && (
                    <Badge variant="secondary" className="text-sm">
                      Card {gameStats.cardsCompleted + 1} / {gameStats.totalCards}
                    </Badge>
                  )}
                  {gameMode === "timed" && (
                    <Badge variant={timeLeft <= 10 ? "destructive" : "secondary"} className="text-sm">
                      <Timer className="h-3 w-3 mr-1" />
                      {timeLeft}s
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-sm">
                    Score: {gameStats.currentScore}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    High Score: {gameStats.highScore}
                  </Badge>
                  {currentStreak > 0 && (
                    <Badge variant="outline" className="text-sm">
                      Streak: {currentStreak}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {gameMode === "5-card" ? "5 Card Challenge" :
                   gameMode === "10-card" ? "10 Card Challenge" :
                   gameMode === "timed" ? "Timed Mode" :
                   gameMode === "hardcore" ? "Hardcore Mode" : ""}
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
                    <Badge variant={guessesUsed >= (gameMode === "hardcore" ? 2 : MAX_GUESSES - 2) ? "destructive" : "secondary"}>
                      {guessesUsed} / {gameMode === "hardcore" ? "3" : MAX_GUESSES} guesses
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
                  {gameStats.currentScore > highScores[gameMode as keyof HighScores]
                    ? "🎉 New High Score!"
                    : `High Score: ${highScores[gameMode as keyof HighScores]}`}
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
