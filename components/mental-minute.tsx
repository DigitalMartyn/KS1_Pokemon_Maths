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
    name: "Eevee",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZxhEc0cQx6kICrbvHrFradICZOoD2sC2ivg&s",
    maxHp: 2,
  },
  {
    name: "Vaporeon",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgIMGrXxBAjlvtgpuK8ZBK6aVqhfcHToredw&s",
    maxHp: 3,
  },
  {
    name: "Jolteon",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSO5FM2dBGQvygiJqRQ7YoXFqQSFHdz9K2cg&s",
    maxHp: 5,
  },
  {
    name: "Flareon",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMZ_E-rvAd58NNIgBTDljxTpYvC7nrnBQt8g&s",
    maxHp: 5,
  },
  {
    name: "Espeon",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvsoPtCnddl-6kEzFoWb7cUcciHSDa4794kw&s",
    maxHp: 5,
  },
  {
    name: "Umbreon",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSPqauxfWCnyvLXPHmTqVBv16YzQOrNHByMiQ&s",
    maxHp: 5,
  },
  {
    name: "Leafeon",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQn1cLUcGOQ9_0cCdS8lQHTjUVUq0PqRXGXQw&s",
    maxHp: 5,
  },
  {
    name: "Glaceon",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJACHREbdJc1ejJcFl_vIujPHAV-HWuLiFAA&s",
    maxHp: 5,
  },
  {
    name: "Sylveon",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQphaOivpdVpr2vJIK4IL_-PQSFygWEC8QA-g&s",
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
    <div className="flex flex-col md:flex-row items-start justify-center gap-4 w-full max-w-5xl">
      {/* Audio elements for sounds */}
      <audio ref={correctSoundRef} src="https://www.myinstants.com/media/sounds/answer-correct.mp3" preload="auto" />
      <audio
        ref={incorrectSoundRef}
        src="https://www.orangefreesounds.com/wp-content/uploads/2014/08/Wrong-answer-sound-effect.mp3?"
        preload="auto"
      />

      {/* Pokemon Display Box */}
      <div className="w-full md:w-48 mb-4 md:mb-0">
        <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-b from-emerald-400 to-purple-500 p-4">
          <div className="bg-blue-400 rounded-lg p-4 relative h-full">
            {/* Background pattern */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-8 opacity-30">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="flex items-center justify-center text-white text-xl">
                  {["+", "-", "×", "÷", "?"][Math.floor(Math.random() * 5)]}
                </div>
              ))}
            </div>

            <div className="relative z-10 flex flex-col items-center h-full">
              {/* Pokemon Header */}
              <div className="text-center mb-2">
                <h2 className="text-xl font-bold text-white drop-shadow-md">Pokémon</h2>
              </div>

              {/* Pokemon Display */}
              <div className="bg-white rounded-lg p-3 shadow-md flex-1 w-full flex flex-col items-center justify-center">
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={currentPokemon.image || "/placeholder.svg"}
                    alt={currentPokemon.name}
                    className="w-32 h-32 object-contain transition-all duration-300"
                  />
                  <div className="mt-2 text-center">
                    <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {currentPokemon.name}
                    </span>
                  </div>
                  {/* HP Display in Pokemon Box */}
                  <div className="mt-2 w-full">
                    <div className="text-center">
                      <span className="text-sm font-bold text-red-600">HP: {currentHP}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div
                        className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${(currentHP / currentPokemon.maxHp) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Display */}
              <div className="mt-4 bg-white rounded-lg p-2 shadow-md w-full">
                <div className="text-center">
                  <span className="text-sm text-gray-600">Score</span>
                  <div className="text-2xl font-bold text-blue-600">{score}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game */}
      <div className="flex flex-col items-center w-full max-w-md">
        <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-b from-emerald-400 to-purple-500 p-4 relative">
          {/* Title */}
          <div className="text-center mb-2">
            <h1
              className="text-4xl font-bold text-yellow-400 drop-shadow-md tracking-wider"
              style={{ fontFamily: "Comic Sans MS, cursive" }}
            >
              Evie's Maths Challenge
            </h1>
          </div>

          {/* Game board */}
          <div className="bg-blue-400 rounded-lg p-4 relative">
            {/* Background pattern */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-30">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="flex items-center justify-center text-white text-xl">
                  {["+", "-", "×", "÷", "?"][Math.floor(Math.random() * 5)]}
                </div>
              ))}
            </div>

            <div className="relative z-10">
              {/* Timer */}
              <div className="flex justify-center items-center mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                    <div className="absolute text-xl font-bold text-red-600">{timeLeft}</div>
                    <Clock className="w-12 h-12 text-gray-700 opacity-30" />
                    <div
                      className="absolute"
                      style={{
                        top: "50%",
                        left: "50%",
                        height: "40%",
                        width: "2px",
                        background: "red",
                        transformOrigin: "bottom",
                        transform: `translate(-50%, -100%) rotate(${(timeLeft / 60) * 360}deg)`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Problem display */}
              <div className="bg-white rounded-lg p-4 mb-4 shadow-md">
                <div className="text-center text-4xl text-blue-600 font-bold">
                  {problem.num1} {problem.operator} {problem.num2} =
                </div>
              </div>

              {/* Multiple choice answers */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {problem.options.map((option, index) => (
                  <button
                    key={`${option}-${index}`}
                    onClick={() => checkAnswer(option)}
                    disabled={isProcessingAnswer}
                    className={`
                      h-14 rounded-md text-2xl font-bold shadow-md
                      ${
                        selectedAnswer === option
                          ? option === problem.answer
                            ? "bg-green-400"
                            : "bg-red-400"
                          : "bg-blue-300 hover:bg-blue-200 active:bg-blue-400"
                      }
                      transition-colors duration-200 border-2 border-blue-500
                      ${isProcessingAnswer ? "cursor-not-allowed" : "cursor-pointer"}
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Game over overlay */}
          {!gameActive && timeLeft === 0 && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
              <div className="text-white text-center">
                <h2 className="text-3xl font-bold mb-2">Time's Up!</h2>
                <p className="text-xl mb-4">Your score: {score}</p>
                {isNewHighScore && <div className="mb-4 text-yellow-300 font-bold">🏆 New High Score! 🏆</div>}
                <button
                  onClick={startGame}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 px-6 rounded-full text-lg"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {/* Start game overlay */}
          {!gameActive && timeLeft === 60 && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50">
              <div className="text-white text-center">
                <h2 className="text-3xl font-bold mb-4">Evie's Maths Challenge</h2>
                <p className="text-xl mb-6">Solve as many math problems as you can in 60 seconds!</p>
                <button
                  onClick={startGame}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-2 px-6 rounded-full text-lg"
                >
                  Start Game
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* High Score Table */}
      <div className="w-full md:w-64 mt-4 md:mt-0">
        <div className="w-full h-full rounded-lg overflow-hidden bg-gradient-to-b from-emerald-400 to-purple-500 p-4">
          <div className="bg-blue-400 rounded-lg p-4 relative">
            {/* Background pattern */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-8 opacity-30">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="flex items-center justify-center text-white text-xl">
                  {["+", "-", "×", "÷", "?"][Math.floor(Math.random() * 5)]}
                </div>
              ))}
            </div>

            <div className="relative z-10">
              {/* High Score Header */}
              <div className="flex items-center justify-center mb-4">
                <Trophy className="w-5 h-5 text-yellow-300 mr-2" />
                <h2 className="text-xl font-bold text-white">High Scores</h2>
              </div>

              {/* Score List */}
              <div className="bg-white rounded-lg p-3 shadow-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left pb-2 text-sm font-bold text-blue-600">Score</th>
                      <th className="text-right pb-2 text-sm font-bold text-blue-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highScores.map((entry, index) => (
                      <tr key={index} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 text-lg font-bold">
                          {index + 1}. {entry.score}
                        </td>
                        <td className="py-2 text-sm font-medium text-right">{entry.date}</td>
                      </tr>
                    ))}
                    {highScores.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-gray-500">
                          No scores yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
