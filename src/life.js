/* global fnToWorker */
window.life = {
	epoch: 0,
	stopped: true,
	
	length: 0,
	height: 0,
	width: 0,
	
	workers: [],
	statesBuffer: null,
	statesView: null,

	initWorkers: function (count) {
		var transferList = ['result.changesBuffer'];
		this.workersLength = count;
		while (count--) {
			this.workers.push(fnToWorker(this.process, transferList));
		}
	},

	stepPlain: function () {
		console.time('plain');
		this.epoch++;
		return new Promise(function (resolve) {
			var result = this.process({
				statesBuffer: this.statesBuffer, 
				start: 0, 
				end: this.height,
				width: this.width,
				offset: 0
			});
			console.timeEnd('plain');
			this.updateMatrix([result.changesBuffer]);
			resolve();
		}.bind(this));
	},

	stepWorkers: function automateProcessStep() {
		console.time('workers');
		this.epoch++;
		return new Promise(function (resolve) {
			var part = Math.round(this.height/this.workersLength),
				startPart = 0,
				endPart = part + 1,
				startIndex = 0,
				endIndex = part;
			for (var i = 0; i < this.workersLength; i++) {
				var worker = this.workers[i],
					offset = startPart*this.width,
					data = {
						statesBuffer: this.statesBuffer.slice(offset, endPart*this.width),
						start: startIndex,
						end: endIndex,
						width: this.width,
						offset: offset
					};
				worker.addEventListener('message', onWorkerMessage);
				worker.postMessage(data, [data.statesBuffer]);
				
				startPart = (i+1)*part - 1;
				endPart += part;
				startIndex = 1;
				endIndex = part + 1;
			}

			var that = this,
				workersDone = 0,
				changes = [];

			function onWorkerMessage(event) {
				event.target.removeEventListener('message', onWorkerMessage);
				workersDone++;
				changes.push(event.data.changesBuffer);
				if (workersDone === that.workersLength) {
					console.timeEnd('workers');
					that.updateMatrix(changes);
					resolve();
				}
			}
		}.bind(this));
	},
	
	process: function (data) {
		var statesView = new Uint8Array(data.statesBuffer);
		var lifeCells = [];
		var sleepCells = [];
		var deadCells = [];
		var currentIndex = data.start*data.width;
		var bottomIndex = currentIndex + data.width;
		var topIndex = currentIndex - data.width;
		var end = data.width*data.end;

		while (currentIndex < end) {
			var oldValue = statesView[currentIndex];
			if (oldValue !== 0) {
				var sum = (statesView[topIndex-1] || 0)%2 +
					(statesView[topIndex] || 0)%2 +
					(statesView[topIndex+1] || 0)%2 +
					(statesView[currentIndex+1] || 0)%2 +
					(statesView[bottomIndex+1] || 0)%2 +
					(statesView[bottomIndex] || 0)%2 +
					(statesView[bottomIndex-1] || 0)%2 +
					(statesView[currentIndex-1] || 0)%2;

				if (oldValue === 1 && (sum === 2 || sum === 3)) {
					//lifeCells.push(1, currentIndex+data.offset);
				} else if (sum === 3) {
					lifeCells.push(1, currentIndex+data.offset);

					// mark neighbor cells
					var neighborIndex = topIndex - 1;
					for (var i = 0, l = 3; i < l; i++) {
						for (var j = 0; j < l; j++) {
							if (statesView[neighborIndex] !== 1) {
								sleepCells.push(2, neighborIndex+data.offset);
							}
							neighborIndex++;
						}
						neighborIndex += data.width - 3;
					}

				} else if (sum !== 0 || oldValue === 1) {
					sleepCells.push(2, currentIndex+data.offset);
				} else {
					deadCells.push(0, currentIndex+data.offset);
				}
			}

			currentIndex++;
			topIndex++;
			bottomIndex++;
		}
		return {changesBuffer: new Uint32Array(lifeCells.concat(sleepCells).concat(deadCells)).buffer};
	},

	createMatrix: function createMatrixAutomateCtrl(rowsCount, cellsCount, random) {
		this.length = rowsCount*cellsCount;
		this.height = rowsCount;
		this.width = cellsCount;
		this.statesBuffer = new ArrayBuffer(this.length);
		this.statesView = new Uint8Array(this.statesBuffer);
		for (var i = 0; i < this.length; i++) {
			this.statesView[i] = random ? Math.round(Math.random()*0.57) : 0;
		}
		for (i = 0; i < this.length; i++) {
			var value = this.statesView[i];
			// mark dead neighbours as possible for live
			if (value === 1) {
				this.markDeadNeighbours(i);
			}
		}
		return this.statesView;
	},

	markDeadNeighbours: function (index) {
		// go to row above and start from left cell
		index = index - this.width - 1;
		for (var i = 0, l = 3; i < l; i++) {
			for (var j = 0; j < l; j++) {
				if (this.statesView[index] === 0) {
					this.statesView[index] = 2;
				}
				index++;
			}
			index += this.width - 3;
		}
	},

	updateMatrix: function (changedData) {
		if (this.stopped) {
			return;
		}
		console.time('updateViewAndMatrix');
		for (var i = 0, len1 = changedData.length; i < len1; i++) {
			var changesBuffer = changedData[i],
				changesArray = new Uint32Array(changesBuffer),
				j = changesArray.length-1;
			while (j >= 0) {
				var index = changesArray[j],
					value = changesArray[j-1];
				this.statesView[index] = value;
				this.updateView(value, index);
				j -= 2;
			}
		}
		console.timeEnd('updateViewAndMatrix');
	},

	/**
	 * Updates view, implements in controller
	 * @param {number} value
	 * @param {number} index
	 */
	updateView: function () {}
};
