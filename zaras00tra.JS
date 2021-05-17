class Cell {
    constructor(index, richness, neighbors) {
        this.index = index;
        this.richness = richness;
        this.neighbors = neighbors;
    }
    getNeighbor(x) {
        x = x % 6;
        return this.neighbors[x];
    }
    getNeighbors(dir) {
        let list = [];
        let N1 = this.neighbors[dir];
        let N2 = -1;
        let N3 = -1;
        list.push(N1);
        if (N1 === -1) {
            list.push(N2);
        }
        if (N1 !== -1) {
            let cell_N1 = game.cells.find((cell) => cell.index === N1);
            N2 = cell_N1.neighbors[dir];
            list.push(N2);
        }
        if (N2 === -1) {
            list.push(N3);
        }
        if (N2 !== -1) {
            let cell_N2 = game.cells.find((cell) => cell.index === N2);
            let N3 = cell_N2.neighbors[dir];
            list.push(N3);
        }
        return list;
    }
}
class Tree {
    constructor(cellIndex, size, isMine, isDormant) {
        this.cellIndex = cellIndex;
        this.size = size;
        this.isMine = isMine;
        this.isDormant = isDormant;
        this.gainPS = this.getGainPS();
    }
    getGainPS() {
        return this.size;
    }
    getShadowImpact(N, upgrade) {
        let day = game.day + N;
        let treeSize = Math.min(this.size + upgrade, 3);
        let onMe = 0;
        let onOpp = 0;
        let cell = game.cells.find((cell) => cell.index === this.cellIndex);
        let impact = cell.getNeighbors(day % 6);
        for (let i = 0; i < treeSize; i++) {
            let cellIndex = impact[i];
            let tree = game.trees.find((tree) => tree.cellIndex === cellIndex);
            if (typeof tree === "undefined") continue;
            if (tree.isMine && treeSize >= tree.size) {
                onMe += -tree.gainPS;
            }
            if (!tree.isMine && treeSize >= tree.size) {
                onOpp += -tree.gainPS;
            }
        }
        return { onMe, onOpp };
    }
    isShadowed(N, self_upgrade, opp_upgrade) {
        let day = game.day + N;
        let treeSize = Math.min(this.size + self_upgrade, 3);
        let cell = game.cells.find((cell) => cell.index === this.cellIndex);
        let impact = cell.getNeighbors((day + 3) % 6);
        let shadow = false;
        for (let i = 0; i <= 2; i++) {
            let cellIndex = impact[i];
            let tree = game.trees.find((tree) => tree.cellIndex === cellIndex);
            let otherTreeSize = -1;
            //Rajouter notion upgradeable
            if (typeof tree === "undefined") continue;
            if (!tree.isDormant && opp_upgrade && tree.isMine === false) {
                otherTreeSize = Math.min(tree.size + 1, 3);
            }
            if (tree.isDormant || !opp_upgrade) {
                otherTreeSize = tree.size;
            }
            if (treeSize <= otherTreeSize && otherTreeSize > i) {
                shadow = true;
            }
        }
        return shadow;
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
        this.targetTree = this.getTargetTree();
        this.sourceTree = this.getSourceTree();
        this.cost = this.getCost();
        this.richness = this.getRichness();
        this.gain = this.getGain();
        //this.benef = this.getBenef();
        this.impactOnTrees = this.getImpactOnTrees();
        this.impact = this.getImpact();
    }
    getTargetTree() {
        if (this.type !== SEED && this.type !== WAIT) return game.trees.find((tree) => tree.cellIndex === this.targetCellIdx);
        return null;
    }
    getSourceTree() {
        if (this.type === SEED) return game.trees.find((tree) => tree.cellIndex === this.sourceCellIdx);
        return null;
    }
    getImpact() {
        if (this.type === WAIT) return 0;
        if (game.day < 12) {
            //verifier le ration richness VS impact
            if (this.type === SEED && game.getNtrees(0, true) < 1 && game.day > 1)
                return 2000 + this.richness - 3 * this.impactOnTrees.onMe;
            if (this.type === GROW) {
                //check if tree IsShadowed next turn and return sunPointLooseShadow
                let artificial_malus = 0;
                if ([19, 2225, 28, 31, 34].includes(this.targetCellIdx) && game.day < 3) artificial_malus = 0.1;
                let sunPointbenef = 1;
                if (this.targetTree.isShadowed(1, false, false) && this.targetTree.isShadowed(1, true, false)) {
                    return -1;
                }
                if (this.targetTree.isShadowed(1, false, false) && !this.targetTree.isShadowed(1, true, false)) {
                    sunPointbenef += this.targetTree.gainPS + 1;
                }
                sunPointbenef += this.targetTree.getShadowImpact(1, 1).onMe;
                sunPointbenef -= this.targetTree.getShadowImpact(1, 1).onOpp;
                if (sunPointbenef < 0) return -1;
                //on ignore la richness avant le tour 10
                if (sunPointbenef >= 0) return 1000 + (100 * sunPointbenef) / this.cost - artificial_malus;
            }
            if (this.type === COMPLETE) return -1;
            return -1; //just in case
        }
        if (game.day < 19) {
            return -1; //just in case
        }
        if (game.day >= 19) {
            return -1; //just in case
        }
        return -1; //just in case
    }
    getCost() {
        switch (this.type) {
            case WAIT:
                return 0;
            case GROW:
                if (this.targetTree.size === 0) {
                    let score = game.getNtrees(1, true) + 1;
                    return score;
                }
                if (this.targetTree.size === 1) {
                    let score = game.getNtrees(2, true) + 3;
                    return score;
                }
                if (true) {
                    let score = game.getNtrees(3, true) + 7;
                    return score;
                }
            case SEED:
                let score = game.getNtrees(0);
                return score;
            case COMPLETE:
                return 4;
        }
    }
    getGain() {
        if (this.type === SEED) return 0;
        if (this.type === COMPLETE) return -3;
        if (this.type === GROW) return 1;
        if (this.type === WAIT) return 0;
    }
    // getBenef() {
    //     if (this.type !== WAIT) return this.gain / this.cost;
    //     return 0;
    // }
    getRichness() {
        let cell = game.cells.find((cell) => cell.index === this.targetCellIdx);
        if (this.type !== WAIT) return cell.richness;
        return null;
    }
    getNeighbors(x) {
        let cell = game.cells.find((cell) => cell.index === this.targetCellIdx);
        if (this.type !== WAIT) return cell.getNeighbors(x);
        return null;
    }

    // a supprimer ???
    getImpactOnTrees() {
        if (this.type !== WAIT) {
            let onMe = 0;
            let onOpp = 0;
            for (let i = 0; i < 6; i++) {
                let neighbors = this.getNeighbors(i);
                neighbors.forEach((cellIndex) => {
                    let tree = game.trees.find((tree) => tree.cellIndex === cellIndex);
                    if (typeof tree !== "undefined" && tree.isMine) {
                        onMe += 1;
                    }
                    if (typeof tree !== "undefined" && !tree.isMine) {
                        onOpp += 1;
                    }
                });
            }
            return { onMe, onOpp };
        }
        if (this.type === WAIT) return null;
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
            return `${SEED} ${this.sourceCellIdx} ${this.targetCellIdx} `;
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
    getNtrees = (size, isMine) => {
        return this.trees.filter((tree) => tree.size === size && tree.isMine === isMine).length;
    };
    getNextAction() {
        if (this.possibleActions.length > 1) {
            this.possibleActions.sort((a, b) => {
                if (b.impact > a.impact) return 1;
                if (b.impact < a.impact) return -1;
                return -1;
            });
            let debug = this.debug();
            return this.possibleActions[0];
        }
        return WAIT;
    }
    debug = () => {
        console.error(this.day + " sort : " + this.possibleActions);
        console.error(" ");
        let padding = [7, 3, 3, 3, 3, 3, 3];
        let mee = [
            "Me : ",
            game.myScore,
            game.mySun,
            game.getNtrees(0, true),
            game.getNtrees(1, true),
            game.getNtrees(2, true),
            game.getNtrees(3, true),
        ];
        let opp = [
            "Opp : ",
            game.myScore,
            game.mySun,
            game.getNtrees(0, false),
            game.getNtrees(1, false),
            game.getNtrees(2, false),
            game.getNtrees(3, false),
        ];
        let row = mee,
            rowString = "";
        for (let i = 0; i < row.length; i++) {
            if (isNaN(row[i])) rowString += row[i].padStart(padding[i]);
            if (!isNaN(row[i])) rowString += row[i].toString(10).padStart(padding[i]);
        }
        console.error(rowString);
        row = opp;
        rowString = "";
        for (let i = 0; i < row.length; i++) {
            if (isNaN(row[i])) rowString += row[i].padStart(padding[i]);
            if (!isNaN(row[i])) rowString += row[i].toString(10).padStart(padding[i]);
        }
        console.error(rowString);

        console.error(" ");
        let header = "",
            empty = " ";
        padding = [8, 7, 7, 4, 4, 4, 10, 10, 10, 10, 10];
        let title = ["type", "source", "target", "T", "R", "C", "impact", "shadow", "shadow+1", "OnMe", "OnOpp"];
        let type, source, id, size, richness, cost, impact, shadow, shadowplus1, impactOnMe, impactOnOpp;
        for (let i = 0; i < title.length; i++) {
            header += title[i].padStart(padding[i]);
        }
        console.error(header);
        for (let j = 0; j < this.possibleActions.length; j++) {
            if (this.possibleActions[j].type === SEED) continue;
            rowString = "";
            row = [];
            let action = this.possibleActions[j];
            type = action.type;
            source = action.sourceCellIdx;
            id = action.targetCellIdx;
            try {
                size = action.targetTree.size;
            } catch {
                size = empty;
            }
            richness = action.richness;
            cost = action.cost;
            impact = action.impact;
            try {
                shadow = action.targetTree.isShadowed(1, false, false);
            } catch {
                shadow = empty;
            }
            try {
                shadowplus1 = action.targetTree.isShadowed(1, true, false);
            } catch {
                shadowplus1 = empty;
            }
            try {
                impactOnMe = action.targetTree.getShadowImpact(1, 1).onMe;
            } catch {
                impactOnMe = empty;
            }
            try {
                impactOnOpp = action.targetTree.getShadowImpact(1, 1).onOpp;
            } catch {
                impactOnOpp = empty;
            }
            row = [type, source, id, size, richness, cost, impact, shadow, shadowplus1, impactOnMe, impactOnOpp];
            for (let i = 0; i < row.length; i++) {
                try {
                    if (isNaN(row[i])) rowString += row[i].padStart(padding[i]);
                    if (!isNaN(row[i])) {
                        let arround = Math.round(row[i] * 100) / 100;
                        rowString += arround.toString(10).padStart(padding[i]);
                    }
                } catch {
                    rowString += empty.padStart(padding[i]);
                }
            }
            console.error(rowString);
        }
    };
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
    game.cells.push(new Cell(index, richness, [neigh0, neigh1, neigh2, neigh3, neigh4, neigh5]));
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
