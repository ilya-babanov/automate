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
		return new Promise(function (resolve, reject) {
			var half = Math.round(this.matrix.length/2);

			this.worker1.addEventListener('message', onWorkerMessage);
			this.worker2.addEventListener('message', onWorkerMessage);

			this.worker1.postMessage({matrix: this.matrix.slice(0, half+1), start: 0, end: half});
			this.worker2.postMessage({matrix: this.matrix.slice(half-1), start: 1, end: half+1});


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

		for (var j = 0, len2 = data.matrix[0].length; j < len2; j++) {
			topCopiedRow[j] = {state: 0};
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
		for (var i = 0, len1 = changedData.length; i < len1; i++) {
			var changedCell = changedData[i];
			this.matrix[changedCell.i][changedCell.j].state = changedCell.state;
		}
	}
};