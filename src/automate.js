/* global fnToWorker */

window.automate = {
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
		var topCopiedRow = new Uint8Array(data.width),
			middleCopiedRow = new Uint8Array(data.width),
			statesView = new Uint8Array(data.statesBuffer),
			changedCells = [],
			currentIndex = 0, relativeIndex = 0, bottomIndex = 0,
			end = data.width*data.end;
		
		if (data.start !== 0) {
			for (currentIndex; currentIndex < data.width; currentIndex++) {
				topCopiedRow[currentIndex] = statesView[currentIndex];
			}
		}
		
		currentIndex = data.start*data.width;
		bottomIndex = currentIndex + data.width;
		relativeIndex = 0;
		while (currentIndex < end) {
			var oldIndex = middleCopiedRow[relativeIndex] = statesView[currentIndex],
				sum = (topCopiedRow[relativeIndex-1] || 0) +
					topCopiedRow[relativeIndex] +
					(topCopiedRow[relativeIndex+1] || 0) +
					(statesView[currentIndex+1] || 0) +
					(statesView[bottomIndex+1] || 0) +
					statesView[bottomIndex] +
					(statesView[bottomIndex-1] || 0) +
					(middleCopiedRow[relativeIndex-1] || 0);

			if (oldIndex === 1 && (sum === 2 || sum === 3) ) {
				statesView[currentIndex] = 1;
			} else if (sum === 3) {
				statesView[currentIndex] = 1;
			} else {
				statesView[currentIndex] = 0;
			}

			if (statesView[currentIndex] !== oldIndex) {
				changedCells.push(statesView[currentIndex]);
				changedCells.push(currentIndex+data.offset);
			}

			currentIndex++;
			bottomIndex++;
			relativeIndex = currentIndex % data.width;
			if (relativeIndex === 0) {
				topCopiedRow = middleCopiedRow;
				middleCopiedRow = new Uint8Array(data.width);
			}
		}
		return {changesBuffer: new Uint32Array(changedCells).buffer};
	},

	createMatrix: function createMatrixAutomateCtrl(rowsCount, cellsCount, rule, random) {
		this.length = rowsCount*cellsCount;
		this.height = rowsCount;
		this.width = cellsCount;
		this.statesBuffer = new ArrayBuffer(this.length);
		this.statesView = new Uint8Array(this.statesBuffer);
		for (var i = 0; i < this.length; i++) {
			this.statesView[i] = random ? Math.round(Math.random()*0.75) : 0;
		}
		return this.statesView;
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
