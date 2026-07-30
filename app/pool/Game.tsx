"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";

const TABLE_WIDTH = 900;
const TABLE_HEIGHT = 500;
const BALL_RADIUS = 10;
const POCKET_RADIUS = 18;
const FRICTION = 0.985;
const MAX_POWER = 20;
const MIN_VELOCITY = 0.05;

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  stripe: boolean;
  pocketed: boolean;
  number: number;
}

export default function Game({ tableId }: { tableId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [winner, setWinner] = useState<number | null>(null);

  const ballsRef = useRef<Ball[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, down: false });
  const powerRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);
  const firstBallPocketedRef = useRef(false);
  const gameStatusRef = useRef<"aiming" | "shooting" | "placing_cue" | "game_over">("aiming");
  const currentPlayerRef = useRef(1);
  const player1TypeRef = useRef<"solids" | "stripes" | null>(null);
  const player2TypeRef = useRef<"solids" | "stripes" | null>(null);
  const player1PocketedRef = useRef<number[]>([]);
  const player2PocketedRef = useRef<number[]>([]);
  const winnerRef = useRef<number | null>(null);
  const messageRef = useRef("");
  const cueBallInHandRef = useRef(false);
  const gameLoopRef = useRef<() => void>(() => {});

  const pockets = useMemo(() => [
    { x: 0, y: 0 },
    { x: TABLE_WIDTH / 2, y: 0 },
    { x: TABLE_WIDTH, y: 0 },
    { x: 0, y: TABLE_HEIGHT },
    { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },
    { x: TABLE_WIDTH, y: TABLE_HEIGHT },
  ], []);

  const initBalls = useCallback(() => {
    const balls: Ball[] = [];
    const colors = [
      { color: "#FFFFFF", stripe: false, number: 0 },
      { color: "#FFD700", stripe: false, number: 1 },
      { color: "#0000FF", stripe: false, number: 2 },
      { color: "#FF0000", stripe: false, number: 3 },
      { color: "#800080", stripe: false, number: 4 },
      { color: "#FFA500", stripe: false, number: 5 },
      { color: "#008000", stripe: false, number: 6 },
      { color: "#800000", stripe: false, number: 7 },
      { color: "#000000", stripe: false, number: 8 },
      { color: "#FFD700", stripe: true, number: 9 },
      { color: "#0000FF", stripe: true, number: 10 },
      { color: "#FF0000", stripe: true, number: 11 },
      { color: "#800080", stripe: true, number: 12 },
      { color: "#FFA500", stripe: true, number: 13 },
      { color: "#008000", stripe: true, number: 14 },
      { color: "#800000", stripe: true, number: 15 },
    ];

    const startX = TABLE_WIDTH * 0.7;
    const startY = TABLE_HEIGHT / 2;

    balls.push({
      id: 0,
      x: TABLE_WIDTH * 0.25,
      y: TABLE_HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      color: colors[0].color,
      stripe: false,
      pocketed: false,
      number: 0,
    });

    const rackOrder = [1, 9, 2, 10, 8, 11, 3, 12, 4, 13, 5, 14, 6, 15, 7];
    let ballIndex = 0;
    const spacing = BALL_RADIUS * 2.1;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        const x = startX + row * spacing * 0.866;
        const y = startY + (col - row / 2) * spacing;
        const num = rackOrder[ballIndex];
        const colorInfo = colors[num];
        balls.push({
          id: num,
          x,
          y,
          vx: 0,
          vy: 0,
          radius: BALL_RADIUS,
          color: colorInfo.color,
          stripe: colorInfo.stripe,
          pocketed: false,
          number: num,
        });
        ballIndex++;
      }
    }

    ballsRef.current = balls;
  }, []);

  const distance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  };

  const resolveBallCollision = (b1: Ball, b2: Ball) => {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < b1.radius + b2.radius && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;

      const dvx = b1.vx - b2.vx;
      const dvy = b1.vy - b2.vy;
      const dvn = dvx * nx + dvy * ny;

      if (dvn > 0) {
        b1.vx -= dvn * nx;
        b1.vy -= dvn * ny;
        b2.vx += dvn * nx;
        b2.vy += dvn * ny;

        const overlap = (b1.radius + b2.radius - dist) / 2;
        b1.x -= overlap * nx;
        b1.y -= overlap * ny;
        b2.x += overlap * nx;
        b2.y += overlap * ny;
      }
    }
  };

  const checkCushionCollision = (ball: Ball) => {
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = -ball.vx * 0.8;
    }
    if (ball.x + ball.radius > TABLE_WIDTH) {
      ball.x = TABLE_WIDTH - ball.radius;
      ball.vx = -ball.vx * 0.8;
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = -ball.vy * 0.8;
    }
    if (ball.y + ball.radius > TABLE_HEIGHT) {
      ball.y = TABLE_HEIGHT - ball.radius;
      ball.vy = -ball.vy * 0.8;
    }
  };

  const checkPockets = useCallback(() => {
    ballsRef.current.forEach((ball) => {
      if (ball.pocketed) return;
      pockets.forEach((pocket) => {
        if (distance(ball.x, ball.y, pocket.x, pocket.y) < POCKET_RADIUS) {
          ball.pocketed = true;
          ball.vx = 0;
          ball.vy = 0;

          if (ball.id === 0) {
            cueBallInHandRef.current = true;
            messageRef.current = "Scratch! Ball in hand.";
          } else if (ball.id === 8) {
            const currentType = currentPlayerRef.current === 1 ? player1TypeRef.current : player2TypeRef.current;
            
            if (currentType === null) {
              winnerRef.current = currentPlayerRef.current === 1 ? 2 : 1;
              messageRef.current = `Player ${currentPlayerRef.current === 1 ? 2 : 1} wins!`;
            } else {
              winnerRef.current = currentPlayerRef.current;
              messageRef.current = `Player ${currentPlayerRef.current} wins!`;
            }
            gameStatusRef.current = "game_over";
          } else {
            const isSolid = ball.id >= 1 && ball.id <= 7;

            if (!firstBallPocketedRef.current) {
              firstBallPocketedRef.current = true;
              const newType = isSolid ? "solids" : "stripes";
              if (currentPlayerRef.current === 1) {
                player1TypeRef.current = newType;
                player2TypeRef.current = newType === "solids" ? "stripes" : "solids";
              } else {
                player2TypeRef.current = newType;
                player1TypeRef.current = newType === "solids" ? "stripes" : "solids";
              }
              messageRef.current = `Player ${currentPlayerRef.current} is ${newType}`;
            }

            if (currentPlayerRef.current === 1) {
              player1PocketedRef.current = [...player1PocketedRef.current, ball.id];
            } else {
              player2PocketedRef.current = [...player2PocketedRef.current, ball.id];
            }
          }
        }
      });
    });
  }, [pockets]);

  const updatePhysics = useCallback(() => {
    let anyMoving = false;

    ballsRef.current.forEach((ball) => {
      if (ball.pocketed) return;

      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vx *= FRICTION;
      ball.vy *= FRICTION;

      if (Math.abs(ball.vx) < MIN_VELOCITY) ball.vx = 0;
      if (Math.abs(ball.vy) < MIN_VELOCITY) ball.vy = 0;

      if (ball.vx !== 0 || ball.vy !== 0) {
        anyMoving = true;
      }

      checkCushionCollision(ball);
    });

    for (let i = 0; i < ballsRef.current.length; i++) {
      for (let j = i + 1; j < ballsRef.current.length; j++) {
        const b1 = ballsRef.current[i];
        const b2 = ballsRef.current[j];
        if (!b1.pocketed && !b2.pocketed) {
          resolveBallCollision(b1, b2);
        }
      }
    }

    checkPockets();

    if (!anyMoving && gameStatusRef.current === "shooting") {
      gameStatusRef.current = "aiming";
      if (!winnerRef.current) {
        const nextPlayer = currentPlayerRef.current === 1 ? 2 : 1;
        currentPlayerRef.current = nextPlayer;
        setCurrentPlayer(nextPlayer);
        messageRef.current = `Player ${nextPlayer}'s turn`;
      }
    }

    return anyMoving;
  }, [checkPockets]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0a5c36";
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    ctx.strokeStyle = "#3d2817";
    ctx.lineWidth = 20;
    ctx.strokeRect(10, 10, TABLE_WIDTH - 20, TABLE_HEIGHT - 20);

    ctx.fillStyle = "#0a5c36";
    pockets.forEach((pocket) => {
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, POCKET_RADIUS + 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#1a1a1a";
    pockets.forEach((pocket) => {
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, POCKET_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    ballsRef.current.forEach((ball) => {
      if (ball.pocketed) return;

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (ball.stripe) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }

      if (ball.number > 0) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.font = `bold ${ball.radius * 0.5}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ball.number.toString(), ball.x, ball.y + 0.5);
      }
    });

    if (gameStatusRef.current === "aiming" && ballsRef.current[0] && !ballsRef.current[0].pocketed) {
      const cueBall = ballsRef.current[0];
      const dx = mouseRef.current.x - cueBall.x;
      const dy = mouseRef.current.y - cueBall.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        const power = Math.min(powerRef.current / MAX_POWER, 1);
        const aimX = cueBall.x - (dx / dist) * (power * 150 + 20);
        const aimY = cueBall.y - (dy / dist) * (power * 150 + 20);

        ctx.beginPath();
        ctx.moveTo(cueBall.x, cueBall.y);
        ctx.lineTo(aimX, aimY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (power > 0.1) {
          const startX = cueBall.x - (dx / dist) * (cueBall.radius + 5);
          const startY = cueBall.y - (dy / dist) * (cueBall.radius + 5);
          const endX = cueBall.x - (dx / dist) * (cueBall.radius + 5 + power * 100);
          const endY = cueBall.y - (dy / dist) * (cueBall.radius + 5 + power * 100);

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.strokeStyle = "#d4a574";
          ctx.lineWidth = 6;
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, TABLE_WIDTH, 30);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `Table ${tableId} | Player ${currentPlayerRef.current}'s Turn | ${messageRef.current || (player1TypeRef.current || player2TypeRef.current ? "Game in progress" : "Break to start")}`,
      TABLE_WIDTH / 2,
      20
    );
  }, [tableId, pockets]);

  useEffect(() => {
    gameLoopRef.current = () => {
      if (gameStatusRef.current === "shooting") {
        updatePhysics();
      }
      draw();
      animationRef.current = requestAnimationFrame(gameLoopRef.current);
    };
  }, [updatePhysics, draw]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoopRef.current);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = TABLE_WIDTH / rect.width;
    const scaleY = TABLE_HEIGHT / rect.height;
    mouseRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      down: mouseRef.current.down,
    };

    if (gameStatusRef.current === "aiming" && mouseRef.current.down) {
      powerRef.current = Math.min(
        Math.max(
          distance(
            ballsRef.current[0].x,
            ballsRef.current[0].y,
            mouseRef.current.x,
            mouseRef.current.y
          ) / 10,
          0
        ),
        MAX_POWER
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = TABLE_WIDTH / rect.width;
    const scaleY = TABLE_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (gameStatusRef.current === "placing_cue") {
      const cueBall = ballsRef.current[0];
      if (x > 0 && x < TABLE_WIDTH && y > 0 && y < TABLE_HEIGHT) {
        let valid = true;
        ballsRef.current.forEach((ball) => {
          if (ball.id !== 0 && !ball.pocketed) {
            if (distance(x, y, ball.x, ball.y) < BALL_RADIUS * 2) {
              valid = false;
            }
          }
        });
        if (valid) {
          cueBall.x = x;
          cueBall.y = y;
          cueBall.pocketed = false;
          cueBallInHandRef.current = false;
          gameStatusRef.current = "aiming";
        }
      }
      return;
    }

    if (gameStatusRef.current === "aiming") {
      mouseRef.current = { x, y, down: true };
      powerRef.current = 0;
    }
  };

  const handleMouseUp = () => {
    if (gameStatusRef.current === "aiming" && powerRef.current > 1) {
      const cueBall = ballsRef.current[0];
      if (cueBall && !cueBall.pocketed) {
        const dx = mouseRef.current.x - cueBall.x;
        const dy = mouseRef.current.y - cueBall.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          cueBall.vx = (-dx / dist) * powerRef.current;
          cueBall.vy = (-dy / dist) * powerRef.current;
          gameStatusRef.current = "shooting";
          powerRef.current = 0;
        }
      }
    }
    mouseRef.current.down = false;
  };

  const resetGame = () => {
    initBalls();
    gameStatusRef.current = "aiming";
    currentPlayerRef.current = 1;
    setCurrentPlayer(1);
    player1TypeRef.current = null;
    player2TypeRef.current = null;
    player1PocketedRef.current = [];
    player2PocketedRef.current = [];
    winnerRef.current = null;
    setWinner(null);
    messageRef.current = "";
    cueBallInHandRef.current = false;
    firstBallPocketedRef.current = false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex flex-col items-center py-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-4 h-4 rounded-full ${
              currentPlayer === 1
                ? "bg-blue-500 shadow-lg shadow-blue-500/50"
                : "bg-gray-600"
            }`}
          ></div>
          <span className="text-sm font-medium">Player 1</span>
        </div>
        <div className="text-gray-500">vs</div>
        <div className="flex items-center gap-2">
          <div
            className={`w-4 h-4 rounded-full ${
              currentPlayer === 2
                ? "bg-red-500 shadow-lg shadow-red-500/50"
                : "bg-gray-600"
            }`}
          ></div>
          <span className="text-sm font-medium">Player 2</span>
        </div>
      </div>

      <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-4 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={TABLE_WIDTH}
          height={TABLE_HEIGHT}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="rounded-xl cursor-crosshair"
          style={{ width: "100%", height: "auto", aspectRatio: `${TABLE_WIDTH}/${TABLE_HEIGHT}` }}
        />
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={resetGame}
          className="px-6 py-2 bg-white/10 border border-white/20 rounded-xl text-sm font-medium hover:bg-white/20 transition-all"
        >
          Reset Game
        </button>
        <Link
          href="/"
          className="px-6 py-2 bg-white/10 border border-white/20 rounded-xl text-sm font-medium hover:bg-white/20 transition-all"
        >
          Back to Lobby
        </Link>
      </div>

      {winner && (
        <div className="mt-6 text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            Player {winner} Wins!
          </div>
          <button
            onClick={resetGame}
            className="px-6 py-2 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 transition-all"
          >
            Play Again
          </button>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500 max-w-md">
        <p>Click and drag from the cue ball to aim. Drag further for more power. Release to shoot.</p>
      </div>
    </div>
  );
}
