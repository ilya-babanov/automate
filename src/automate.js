var automate = {
	epoch: 0,
	matrix: [],
	//workers: [],
	
	initWorkers: function () {
		this.worker1 = fnToWorker(this.process);
		this.worker1.first = true;
		this.worker2 = fnToWorker(this.process);
		this.worker2.first = false;
	},

	stepPlain: function () {
		this.epoch++;
		return new Promise(function (resolve, reject) {
			var changedData = this.process({matrix: this.matrix});
			this.updateMatrix(changedData);
			resolve(changedData);
		}.bind(this));
	},
	
	stepWorkers: function automateProcessStep() {
		this.epoch++;
		return new Promise(function (resolve, reject) {
			var half = Math.round(this.matrix.length/2);
			
			this.worker1.addEventListener('message', onWorkerMessage);
			this.worker2.addEventListener('message', onWorkerMessage);
			
			this.worker1.postMessage({matrix: this.matrix.slice(0, half+1), first: true});
			this.worker2.postMessage({matrix: this.matrix.slice(half-1), first: false});
			

			var that = this,
				firstDone = false,
				secondDone = false,
				changedCells = [];
			function onWorkerMessage(event) {
				if (event.target.first) {
					firstDone = true;
				} else {
					secondDone = true;
				}

				that.updateMatrix(event.data);

				changedCells = changedCells.concat(event.data);

				event.target.removeEventListener('message', onWorkerMessage);

				if (firstDone && secondDone) {
					resolve(changedCells);
				}
			}
		}.bind(this));
	},

	process: function (data) {
		var copiedMatrix = [],
			changedCells = [];
		for (var i = 0, len1 = data.matrix.length; i < len1; i++) {
			copiedMatrix[i] = [];
			for (var j = 0, len2 = data.matrix[i].length; j < len2; j++) {
				copiedMatrix[i][j] = {state: data.matrix[i][j].state};
			}
		}
		var startIndex = data.first ? 0 : 1,
			corrector = data.first ? 1 : 0;
		for (i = startIndex; i < len1-corrector; i++) {
			for (j = 0; j < len2; j++) {
				var topRow = copiedMatrix[i-1] || [],
					middleRow = copiedMatrix[i] || [],
					bottomRow = copiedMatrix[i+1] || [],
					currentCopiedCell = copiedMatrix[i][j],
					currentCell = data.matrix[i][j],
					cells = [
							topRow[j-1] || {state: 0},
							topRow[j] || {state: 0},
							topRow[j+1] || {state: 0},
							middleRow[j+1] || {state: 0},
							bottomRow[j+1] || {state: 0},
							bottomRow[j] || {state: 0},
							bottomRow[j-1] || {state: 0},
							middleRow[j-1] || {state: 0}
					],
					sum = cells.reduce(function (prev, current) {
						return prev + current.state;
					}, 0);
				if (currentCopiedCell.state === 1) {
					currentCell.state = +(currentCell.rule.save.indexOf(sum) !== -1);
				} else {
					currentCell.state = +(currentCell.rule.born.indexOf(sum) !== -1);
				}
				if (currentCopiedCell.state !== currentCell.state) {
					changedCells.push(currentCell);
				}
			}
		}
		return changedCells;
	},

	createMatrix: function createMatrixAutomateCtrl(rowsCount, cellsCount, rule, random) {
		for (var i = 0; i < rowsCount; i++) {
			this.matrix[i] = [];
			for (var j = 0; j < cellsCount; j++) {
				var state = random ? Math.round(Math.random()) : 0;
				this.matrix[i][j] =  new Cell(state, i, j, rule);
			}
		}
		return this.matrix;
	},
	
	updateMatrix: function (changedData) {
		for (var i = 0, len1 = changedData.length; i < len1; i++) {
			var changedCell = changedData[i];
			this.matrix[changedCell.i][changedCell.j].state = changedCell.state;
		}
	}
};