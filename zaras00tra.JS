class Cell {
    constructor(index, richness, neighbors) {
      this.index = index;
      this.richness = richness;
      this.neighbors = neighbors;
   }
}
class Tree {
    constructor(cellIndex, size, isMine, isDormant) {
      this.cellIndex = cellIndex;
      this.size = size;
      this.isMine = isMine;
      this.isDormant = isDormant;
   }
}

const WAIT = "WAIT";
const SEED = "SEED";
const GROW = "GROW";
const COMPLETE = "COMPLETE";
class Action {
    constructor(type, targetCellIdx, sourceCellIdx) {
      this.type = type;
      this.targetCellIdx = targetCellIdx;
      this.sourceCellIdx = sourceCellIdx;
      this.impact = this.impact();
      this.cost = this.cost();
      this.richness=this.richness()
    }
    impact = () => {
        switch (this.type) {
            case WAIT: return 0;
            case GROW: return 20;
            case SEED: return 10;
            case COMPLETE:
                if (game.getNtrees(3) > 3) return 100;
                if (game.day >= 21) return 50;
                if (true) return -1
        }
    };
    cost = () => {
        let targetTree = game.trees.filter(tree => tree.cellIndex == this.targetCellIdx)[0]
        let sourceTree = game.trees.filter(tree => tree.cellIndex == this.sourceCellIdx)[0]
        switch(this.type) {
            case WAIT: return 0;
            case GROW:
                if(targetTree.size == 0) return game.getNtrees(1)+1
                if(targetTree.size == 1) return game.getNtrees(2)+3
                if(true) return game.getNtrees(3)+7
            case SEED: return game.getNtrees(0);
            case COMPLETE: return 4;
        }
    }
    richness = () => {
        let targetCell = game.cells.filter(cell => cell.index == this.targetCellIdx)[0]
        return targetCell.richness
    }
    static parse(line) {
        const parts = line.split(" ");
        if (parts[0] === WAIT) {
            return new Action(WAIT);
        }
        if (parts[0] === SEED) {
            return new Action(SEED, parseInt(parts[2]), parseInt(parts[1]));
        }
        return new Action(parts[0], parseInt(parts[1]));
    }
    toString() {
        if (this.type === WAIT) {
            return `WAIT`;
        }
        if (this.type === SEED) {
            return `${SEED} ${this.sourceCellIdx} ${this.targetCellIdx}`;
        }
        return `${this.type} ${this.targetCellIdx}`;
    }
}

class Game {
    constructor() {
        this.day = 0;
        this.nutrients = 0;
        this.cells = [];
        this.possibleActions = [];
        this.trees = [];
        this.mySun = 0;
        this.myScore = 0;
        this.opponentsSun = 0;
        this.opponentScore = 0;
        this.opponentIsWaiting = 0;
    }
    getNtrees = (size) => {
        return this.trees.filter(tree => tree.size == size && tree.isMine == true).length
    }
    getNextAction() {
        // TODO: write your algorithm here
        console.error("brut : " + this.possibleActions);
        if (this.possibleActions.length > 1) {
            this.possibleActions.sort((a,b) => {
                if(b.impact>a.impact) return 1
                if(b.impact<a.impact) return -1
                if(b.cost>a.cost) return 1
                return -1
            });
            console.error("sort : " + this.possibleActions);
            console.error(this.possibleActions);
            return this.possibleActions[0];
        }
        return WAIT;
    }
}

const game = new Game();

const numberOfCells = parseInt(readline());
for (let i = 0; i < numberOfCells; i++) {
    var inputs = readline().split(" ");
    const index = parseInt(inputs[0]);
    const richness = parseInt(inputs[1]);
    const neigh0 = parseInt(inputs[2]);
    const neigh1 = parseInt(inputs[3]);
    const neigh2 = parseInt(inputs[4]);
    const neigh3 = parseInt(inputs[5]);
    const neigh4 = parseInt(inputs[6]);
    const neigh5 = parseInt(inputs[7]);
    game.cells.push(
        new Cell(index, richness, [
            neigh0,
            neigh1,
            neigh2,
            neigh3,
            neigh4,
            neigh5,
        ])
    );
}

while (true) {
    game.day = parseInt(readline());
    game.nutrients = parseInt(readline());
    var inputs = readline().split(" ");
    game.mySun = parseInt(inputs[0]);
    game.myScore = parseInt(inputs[1]);
    var inputs = readline().split(" ");
    game.opponentSun = parseInt(inputs[0]);
    game.opponentScore = parseInt(inputs[1]);
    game.opponentIsWaiting = inputs[2] !== "0";
    game.trees = [];
    const numberOfTrees = parseInt(readline());
    for (let i = 0; i < numberOfTrees; i++) {
        var inputs = readline().split(" ");
        const cellIndex = parseInt(inputs[0]);
        const size = parseInt(inputs[1]);
        const isMine = inputs[2] !== "0";
        const isDormant = inputs[3] !== "0";
        game.trees.push(new Tree(cellIndex, size, isMine, isDormant));
    }
    game.possibleActions = [];
    const numberOfPossibleAction = parseInt(readline());
    for (let i = 0; i < numberOfPossibleAction; i++) {
        const possibleAction = readline();
        game.possibleActions.push(Action.parse(possibleAction));
    }
    const action = game.getNextAction();
    console.log(action.toString());
}
