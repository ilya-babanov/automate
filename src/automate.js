var automate = {
	epoch: 0,
	stopped: true,
	matrix: [],
	workers: [],

	initWorkers: function (count) {
		this.workersLength = count;
		while (count--) {
			this.workers.push(fnToWorker(this.process));
		}
	},

	stepPlain: function () {
		console.time('plain');
		this.epoch++;
		return new Promise(function (resolve, reject) {
			var changedData = this.process({matrix: this.matrix, start: 0, end: this.matrix.length});
			this.updateMatrix(changedData);
			console.timeEnd('plain');
			resolve(changedData);
		}.bind(this));
	},

	stepWorkers: function automateProcessStep() {
		console.time('workers');
		this.epoch++;
		return new Promise(function (resolve) {
			var part = Math.round(this.matrix.length/this.workersLength),
				startPart = 0, 
				endPart = part + 1, 
				startIndex = 0, 
				endIndex = part;
			for (var i = 0; i < this.workersLength; i++) {
				var worker = this.workers[i];
				worker.addEventListener('message', onWorkerMessage);
				worker.postMessage({
					matrix: this.matrix.slice(startPart, endPart), 
					start: startIndex, 
					end: endIndex
				});
				startPart = (i+1)*part - 1;
				endPart += part;
				startIndex = 1;
				endIndex = part + 1;
			}

			var that = this,
				workersDone = 0,
				changedCells = [];

			function onWorkerMessage(event) {
				event.target.removeEventListener('message', onWorkerMessage);
				workersDone++;
				changedCells = changedCells.concat(event.data);

				if (workersDone === that.workersLength) {
					that.updateMatrix(changedCells);
					console.timeEnd('workers');
					resolve(changedCells);
				}
			}
		}.bind(this));
	},

	process: function (data) {
		var topCopiedRow = [],
			middleCopiedRow = [],
			changedCells = [];

		if (data.start !== 0) {
			for (var j = 0, len2 = data.matrix[0].length; j < len2; j++) {
				topCopiedRow[j] = {state: data.matrix[0][j].state};
			}
		} else {
			for (j = 0, len2 = data.matrix[0].length; j < len2; j++) {
				topCopiedRow[j] = {state: 0};
			}
		}

		for (var i = data.start; i < data.end; i++) {
			for (j = 0; j < len2; j++) {
				middleCopiedRow[j] = {state: data.matrix[i][j].state};
				var bottomRow = data.matrix[i+1] || [],
					middleRow = data.matrix[i] || [],
					currentCell = middleRow[j],
					oldState = currentCell.state,
					sum = [
							topCopiedRow[j-1] || {state: 0},
							topCopiedRow[j] || {state: 0},
							topCopiedRow[j+1] || {state: 0},
							middleRow[j+1] || {state: 0},
							bottomRow[j+1] || {state: 0},
							bottomRow[j] || {state: 0},
							bottomRow[j-1] || {state: 0},
							middleCopiedRow[j-1] || {state: 0}
					].reduce(function (prev, current) {
							return prev + current.state;
						}, 0);
				if (oldState === 1) {
					currentCell.state = +(currentCell.rule.save.indexOf(sum) !== -1);
				} else {
					currentCell.state = +(currentCell.rule.born.indexOf(sum) !== -1);
				}
				if (oldState !== currentCell.state) {
					changedCells.push(currentCell);
				}
			}
			topCopiedRow = middleCopiedRow;
			middleCopiedRow = [];
		}
		return changedCells;
	},

	createMatrix: function createMatrixAutomateCtrl(rowsCount, cellsCount, rule, random) {
		for (var i = 0; i < rowsCount; i++) {
			this.matrix[i] = [];
			for (var j = 0; j < cellsCount; j++) {
				var state = random ? Math.round(Math.random()*0.65) : 0;
				this.matrix[i][j] =  new Cell(state, i, j, rule);
			}
		}
		return this.matrix;
	},

	updateMatrix: function (changedData) {
		if (this.stopped) {
			return;
		}
		for (var i = 0, len1 = changedData.length; i < len1; i++) {
			var changedCell = changedData[i];
			this.matrix[changedCell.i][changedCell.j].state = changedCell.state;
		}
	}
};