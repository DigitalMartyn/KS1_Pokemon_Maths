"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Clock, Trophy } from "lucide-react"

// Define a type for high score entries
type HighScoreEntry = {
  score: number
  date: string
}

// Update the Pokemon data structure to include HP
const pokemonEvolutions = [
  {
    name: "EEVEE",
    image: "/images/eevee.png",
    maxHp: 2,
  },
  {
    name: "VAPOREON",
    image: "/images/vaporeon.png",
    maxHp: 3,
  },
  {
    name: "JOLTEON",
    image: "/images/jolteon.png",
    maxHp: 5,
  },
  {
    name: "FLAREON",
    image: "/images/flareon.png",
    maxHp: 5,
  },
  {
    name: "ESPEON",
    image: "/images/espeon.png",
    maxHp: 5,
  },
  {
    name: "UMBREON",
    image: "/images/umbreon.png",
    maxHp: 5,
  },
  {
    name: "LEAFEON",
    image: "/images/leafeon.png",
    maxHp: 5,
  },
  {
    name: "GLACEON",
    image: "/images/glaceon.png",
    maxHp: 5,
  },
  {
    name: "SYLVEON",
    image: "/images/sylveon.png",
    maxHp: 5,
  },
]

export default function MentalMinute() {
  // Add currentHP state
  const [currentPokemon, setCurrentPokemon] = useState(pokemonEvolutions[0])
  const [currentHP, setCurrentHP] = useState(pokemonEvolutions[0].maxHp)
  const [pokemonIndex, setPokemonIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [problem, setProblem] = useState({
    num1: 0,
    num2: 0,
    operator: "+",
    answer: 0,
    options: [0, 0, 0, 0, 0, 0],
  })
  const [gameActive, setGameActive] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false)
  const [highScores, setHighScores] = useState<HighScoreEntry[]>([])
  const [isNewHighScore, setIsNewHighScore] = useState(false)

  // Sound references
  const correctSoundRef = useRef<HTMLAudioElement>(null)
  const incorrectSoundRef = useRef<HTMLAudioElement>(null)

  // Format date as DD/MM
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    return `${day}/${month}`
  }

  // Load high scores from localStorage
  useEffect(() => {
    const savedScores = localStorage.getItem("eviesMathsChallengeHighScores")
    if (savedScores) {
      setHighScores(JSON.parse(savedScores))
    } else {
      // Initialize with some sample scores if none exist
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      const sampleScores: HighScoreEntry[] = [
        { score: 15, date: formatDate(today) },
        { score: 12, date: formatDate(yesterday) },
        { score: 10, date: formatDate(twoDaysAgo) },
      ]
      setHighScores(sampleScores)
      localStorage.setItem("eviesMathsChallengeHighScores", JSON.stringify(sampleScores))
    }
  }, [])

  // Generate multiple choice options
  const generateOptions = useCallback((correctAnswer: number) => {
    // Start with the correct answer
    const options = [correctAnswer]

    // Generate 5 unique wrong answers
    while (options.length < 6) {
      // For small answers, stay within a reasonable range
      const min = Math.max(1, correctAnswer - 10)
      const max = correctAnswer + 10
      const wrongAnswer = Math.floor(Math.random() * (max - min + 1)) + min

      // Ensure the wrong answer is not the correct answer and not already in options
      if (wrongAnswer !== correctAnswer && !options.includes(wrongAnswer)) {
        options.push(wrongAnswer)
      }
    }

    // Shuffle the options
    return options.sort(() => Math.random() - 0.5)
  }, [])

  // Generate a new math problem
  const generateProblem = useCallback(() => {
    // Choose between multiplication and division
    const isMultiplication = Math.random() > 0.5

    let num1, num2, answer, operator

    if (isMultiplication) {
      // Multiplication: 2x, 4x, 5x, or 10x tables
      const multipliers = [2, 3, 4, 5, 10]
      const multiplier = multipliers[Math.floor(Math.random() * multipliers.length)]

      num1 = Math.floor(Math.random() * 10) + 1 // 1-10
      num2 = multiplier
      answer = num1 * num2
      operator = "×"
    } else {
      // Division with divisors 2, 5, 10
      const divisors = [2, 3, 5, 10]
      const divisor = divisors[Math.floor(Math.random() * divisors.length)]

      // Create a number that's divisible by the chosen divisor
      const quotient = Math.floor(Math.random() * 10) + 1 // 1-10
      num1 = quotient * divisor
      num2 = divisor
      answer = quotient
      operator = "÷"
    }

    const options = generateOptions(answer)
    setProblem({ num1, num2, operator, answer, options })
    setSelectedAnswer(null)
    setIsProcessingAnswer(false)
  }, [generateOptions])

  // Update the startGame function to reset Pokemon
  const startGame = () => {
    setGameActive(true)
    setTimeLeft(60)
    setScore(0)
    setIsNewHighScore(false)
    setPokemonIndex(0)
    setCurrentPokemon(pokemonEvolutions[0])
    setCurrentHP(pokemonEvolutions[0].maxHp)
    generateProblem()
  }

  // Play sound
  const playSound = (isCorrect: boolean) => {
    if (isCorrect && correctSoundRef.current) {
      correctSoundRef.current.currentTime = 0
      correctSoundRef.current.play().catch((e) => console.error("Error playing sound:", e))
    } else if (!isCorrect && incorrectSoundRef.current) {
      incorrectSoundRef.current.currentTime = 0
      incorrectSoundRef.current.play().catch((e) => console.error("Error playing sound:", e))
    }
  }

  // Update the checkAnswer function to handle HP reduction and evolution with animation
  const checkAnswer = (selectedNumber: number) => {
    if (!gameActive || isProcessingAnswer) return

    setIsProcessingAnswer(true)
    setSelectedAnswer(selectedNumber)

    const isCorrect = selectedNumber === problem.answer
    playSound(isCorrect)

    if (isCorrect) {
      // Correct answer: increase score and move to next question
      setScore((prev) => prev + 1)

      // Reduce HP by 1
      setCurrentHP((prevHP) => {
        const newHP = prevHP - 1

        // If HP reaches 0, start evolution animation
        if (newHP <= 0 && pokemonIndex < pokemonEvolutions.length - 1) {
          // First set HP to 0 to show empty bar
          setTimeout(() => {
            // After 5 frames (about 83ms), evolve to next Pokemon
            const nextIndex = pokemonIndex + 1
            setPokemonIndex(nextIndex)
            setCurrentPokemon(pokemonEvolutions[nextIndex])
            setCurrentHP(pokemonEvolutions[nextIndex].maxHp)
          }, 83) // 5 frames at 60fps = ~83ms

          return 0 // Set to 0 immediately to show empty bar
        }

        return newHP
      })

      setTimeout(() => {
        generateProblem()
      }, 300) // Shorter delay for correct answers
    } else {
      // Incorrect answer: flash red and move to next question
      setTimeout(() => {
        generateProblem()
      }, 500) // Slightly longer delay to show the red flash
    }
  }

  // Check if current score is a high score
  const checkHighScore = useCallback(() => {
    // Check if the current score is higher than any existing high score
    const lowestHighScore = highScores.length < 5 ? 0 : Math.min(...highScores.map((hs) => hs.score))

    if (score > lowestHighScore || highScores.length < 5) {
      setIsNewHighScore(true)
      saveHighScore()
    }
  }, [score, highScores])

  // Save high score
  const saveHighScore = () => {
    const newEntry: HighScoreEntry = {
      score: score,
      date: formatDate(new Date()),
    }

    // Add new score and sort
    const updatedScores = [...highScores, newEntry].sort((a, b) => b.score - a.score).slice(0, 5) // Keep only top 5

    setHighScores(updatedScores)
    localStorage.setItem("eviesMathsChallengeHighScores", JSON.stringify(updatedScores))
  }

  // Timer effect
  useEffect(() => {
    if (!gameActive) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setGameActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameActive])

  // Check for high score when game ends
  useEffect(() => {
    if (!gameActive && timeLeft === 0 && score > 0) {
      checkHighScore()
    }
  }, [gameActive, timeLeft, score, checkHighScore])

  // Initial problem generation
  useEffect(() => {
    generateProblem()
  }, [generateProblem])

  return (
    <div className="w-full max-w-4xl mx-auto h-screen flex flex-col bg-gradient-to-b from-blue-200 via-green-200 to-green-300 relative overflow-hidden">
      {/* Audio elements for sounds */}
      <audio ref={correctSoundRef} src="https://www.myinstants.com/media/sounds/answer-correct.mp3" preload="auto" />
      <audio
        ref={incorrectSoundRef}
        src="https://www.orangefreesounds.com/wp-content/uploads/2014/08/Wrong-answer-sound-effect.mp3?"
        preload="auto"
      />

      {/* Background grass pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23059669' fillOpacity='0.4'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Top Section - Pokemon Info and Battle Area */}
      <div className="flex-1 relative p-4">
        {/* Enemy Pokemon Name and HP (Top Left) */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-white border-4 border-gray-800 rounded-lg p-3 shadow-lg font-mono text-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-gray-800">{currentPokemon.name}</span>
              <span className="text-blue-600">♂</span>
              <span className="text-xs bg-yellow-400 px-1 rounded">Lv{20 + pokemonIndex * 5}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-600">HP</span>
              <div className="w-24 h-2 bg-gray-300 border border-gray-600 rounded-sm overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentHP > currentPokemon.maxHp * 0.5
                      ? "bg-green-500"
                      : currentHP > currentPokemon.maxHp * 0.2
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${(currentHP / currentPokemon.maxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enemy Pokemon (Top Right) */}
        <div className="absolute top-8 right-8 z-10">
          <div className="relative">
            <img
              src={currentPokemon.image || "/placeholder.svg"}
              alt={currentPokemon.name}
              className="w-32 h-32 object-contain pixelated"
              style={{ imageRendering: "pixelated" }}
            />
            {/* Grass platform */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-40 h-8 bg-green-400 rounded-full opacity-60" />
          </div>
        </div>

        {/* Score Box (Middle Right) */}
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
          <div className="bg-white border-4 border-gray-800 rounded-lg p-4 shadow-lg font-mono">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold text-gray-800">SCORE</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 text-center">{score}</div>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-gray-800">{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Player Pokemon (Bottom Left) */}
        <div className="absolute bottom-32 left-16 z-10">
          <div className="relative">
            <img
              src="/images/eevee.png"
              alt="Player Eevee"
              className="w-32 h-32 object-contain pixelated"
              style={{ imageRendering: "pixelated" }}
            />
            {/* Grass platform */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-40 h-8 bg-green-400 rounded-full opacity-60" />
          </div>
        </div>
      </div>

      {/* Bottom Battle Interface - Overlaid on main box */}
      <div className="absolute bottom-0 left-0 right-0 h-48 z-20">
        {/* Battle text box */}
        <div className="h-full p-4">
          <div className="bg-blue-900 border-4 border-yellow-400 rounded-lg h-full p-4 font-mono relative shadow-2xl">
            {gameActive ? (
              <div className="h-full flex flex-col">
                {/* Math Problem */}
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-white mb-2">
                    What is {problem.num1} {problem.operator} {problem.num2}?
                  </div>
                </div>

                {/* Multiple Choice Options */}
                <div className="grid grid-cols-3 gap-3 flex-1">
                  {problem.options.map((option, index) => (
                    <button
                      key={`${option}-${index}`}
                      onClick={() => checkAnswer(option)}
                      disabled={isProcessingAnswer}
                      className={`
                        h-12 rounded-md text-lg font-bold shadow-md border-2 transition-all duration-200
                        ${
                          selectedAnswer === option
                            ? option === problem.answer
                              ? "bg-green-400 border-green-600 text-white"
                              : "bg-red-400 border-red-600 text-white"
                            : "bg-white border-gray-400 hover:bg-gray-100 active:bg-gray-200 text-gray-800"
                        }
                        ${isProcessingAnswer ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  {timeLeft === 60 ? (
                    <>
                      <div className="text-xl font-bold text-white mb-4">EVIE'S MATHS CHALLENGE</div>
                      <div className="text-sm text-gray-300 mb-6">Solve math problems to defeat Pokemon!</div>
                      <button
                        onClick={startGame}
                        className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-3 px-6 rounded-lg text-lg border-2 border-yellow-600"
                      >
                        START BATTLE
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-xl font-bold text-white mb-2">BATTLE OVER!</div>
                      <div className="text-lg text-gray-300 mb-4">Final Score: {score}</div>
                      {isNewHighScore && <div className="text-yellow-400 font-bold mb-4">🏆 NEW HIGH SCORE! 🏆</div>}
                      <button
                        onClick={startGame}
                        className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-3 px-6 rounded-lg text-lg border-2 border-yellow-600"
                      >
                        BATTLE AGAIN
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* High Scores Panel (Hidden during game, shown on sides) */}
      {!gameActive && (
        <div className="absolute top-4 right-4 w-64">
          <div className="bg-white border-4 border-gray-800 rounded-lg p-4 shadow-lg font-mono">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-gray-800">HIGH SCORES</span>
            </div>
            <div className="space-y-1">
              {highScores.map((entry, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>
                    {index + 1}. {entry.score}
                  </span>
                  <span className="text-gray-600">{entry.date}</span>
                </div>
              ))}
              {highScores.length === 0 && <div className="text-center text-gray-500 text-sm">No scores yet</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
