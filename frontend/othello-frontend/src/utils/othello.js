// Othello game logic

export const EMPTY = 0
export const BLACK = 1
export const WHITE = 2

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0,  -1],           [0,  1],
  [1,  -1], [1,  0], [1,  1],
]

export const initBoard = () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(EMPTY))
  board[3][3] = WHITE
  board[3][4] = BLACK
  board[4][3] = BLACK
  board[4][4] = WHITE
  return board
}

export const getFlips = (board, row, col, player) => {
  if (board[row][col] !== EMPTY) return []
  const opponent = player === BLACK ? WHITE : BLACK
  const allFlips = []
  for (const [dr, dc] of DIRS) {
    const flips = []
    let r = row + dr, c = col + dc
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opponent) {
      flips.push([r, c])
      r += dr; c += dc
    }
    if (flips.length > 0 && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === player) {
      allFlips.push(...flips)
    }
  }
  return allFlips
}

export const getValidMoves = (board, player) => {
  const moves = []
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (getFlips(board, r, c, player).length > 0) moves.push([r, c])
  return moves
}

export const applyMove = (board, row, col, player) => {
  const flips = getFlips(board, row, col, player)
  if (flips.length === 0) return null
  const next = board.map((r) => [...r])
  next[row][col] = player
  for (const [r, c] of flips) next[r][c] = player
  return next
}

export const countPieces = (board) => {
  let black = 0, white = 0
  for (const row of board)
    for (const cell of row) {
      if (cell === BLACK) black++
      if (cell === WHITE) white++
    }
  return { black, white }
}
