# SpatialGrid – Optimized Proximity Lookup

The `SpatialGrid` class is an **optimization layer for detecting nearby players** in a game world.  
Instead of checking every player in the room (which would be `O(n²)` in the worst case), it uses **grid-based spatial partitioning** to efficiently determine which players are near each other.

---

## **High-Level Concept**

The game world (room) is divided into **grid cells** (squares of size `cellSize × cellSize`).  
Each user’s `(x, y)` position is mapped to one of these cells.

- **Without a grid:** We check every player in the room for proximity – `O(n)` per query.
- **With a grid:** We only check players **in the same cell or neighboring cells** – `O(k)` where `k << n`.

This makes the system **scalable** for hundreds or even thousands of players.

---

## **Key Attributes**

### **1. `private cellSize: number;`**
- The width/height of each grid cell (in game units, e.g., pixels).
- Determines how "fine-grained" the grid is.
- **Example:** `cellSize = 200` means each grid cell covers a `200 × 200` area in your world.

---

### **2. `private grid: Map<string, Map<CellKey, Set<string>>> = new Map();`**
- **Structure:**  
  `roomId → cellKey → Set<userId>`
- For each `roomId`, we maintain a **map of cells**, and for each cell, we store a **set of user IDs** currently inside that cell.
- A `cellKey` is a string like `"3:5"` representing a grid cell at coordinates `(3, 5)`.

---

### **3. `private userCells: Map<string, CellKey> = new Map();`**
- Maps each **userId** to the `cellKey` of the cell they are currently in.
- Allows **quick removal or movement** of a user from their previous cell.

---

## **Key Functions**

### **1. `private key(x: number, y: number): CellKey`**
- Converts `(x, y)` coordinates into a grid cell key.
- Uses `Math.floor(x / cellSize)` and `Math.floor(y / cellSize)` to determine the cell.
- **Example:**  
  If `cellSize = 200` and `(x=350, y=420)` → `(cx=1, cy=2)` → `key = "1:2"`.

---

### **2. `private ensureRoom(roomId: string)`**
- Ensures that the `grid` has an entry for a given `roomId`.
- If no map exists for that room, it initializes a new `Map<CellKey, Set<string>>`.
```ts
if (!this.grid.has("room1")) this.grid.set("room1", new Map());
