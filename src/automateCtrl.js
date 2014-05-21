(function () {
	var $timeout,
		runTimeoutPromise,
		changeSizePromise;
	
	var AutomateCtrl = function ($timeoutInstance) {
		$timeout = $timeoutInstance;
		this.automate = automate;

		this.rowsCount = 60;
		this.cellsCount = 90;
		
		this.timeoutMs = 10;

		this.canvasRatio = 12;
		this.cellSize = this.canvasRatio - 2;
		this.binded = {
			onMouseMove: this.onMouseMove.bind(this),
			onMouseDown: this.onMouseDown.bind(this),
			onMouseUp: this.onMouseUp.bind(this),
			onCanvasClick: this.onCanvasClick.bind(this)
		};

		automate.initWorkers(6);
		automate.updateView = this.onUpdateView.bind(this);
		this.useWorkers = true;
		this.toggleStepLogic();

		this.rule = {
			born: [3],
			save: [2, 3]
		};

		automate.createMatrix(this.rowsCount, this.cellsCount, this.rule, true);

		this.createCanvas();
	};

	AutomateCtrl.prototype.startLogic = function startLogic() {
		$timeout.cancel(runTimeoutPromise);
		automate.stopped = false;
		this.step();
		this.run();
	};

	AutomateCtrl.prototype.step = function step() {
	};

	AutomateCtrl.prototype.toggleStepLogic = function toggleStepLogic() {
		if (this.useWorkers) {
			this.step = automate.stepWorkers.bind(automate);
		} else {
			this.step = automate.stepPlain.bind(automate);
		}
	};

	AutomateCtrl.prototype.stopLogic = function stopLogic() {
		automate.stopped = true;
		$timeout.cancel(runTimeoutPromise);
	};

	AutomateCtrl.prototype.processStep = function processStep() {
		this.stopLogic();
		automate.stopped = false;
		this.step().then(function () {
			automate.stopped = true;
		}.bind(this));
	};

	AutomateCtrl.prototype.clearMatrix = function clearMatrix() {
		this.stopLogic();
		this.updateWholeCanvas(automate.createMatrix(this.rowsCount, this.cellsCount, this.rule, false));
		automate.epoch = 0;
	};

	AutomateCtrl.prototype.randomMatrix = function randomMatrix() {
		this.stopLogic();
		this.updateWholeCanvas(automate.createMatrix(this.rowsCount, this.cellsCount, this.rule, true));
		automate.epoch = 0;
	};


	AutomateCtrl.prototype.changeSize = function changeSize() {
		$timeout.cancel(changeSizePromise);

		changeSizePromise = $timeout(function () {
			this.stopLogic();

			this.cellSize = this.canvasRatio - 2;
			automate.createMatrix(this.rowsCount, this.cellsCount, this.rule, false);

			this.canvas.removeEventListener('click', this.binded.onCanvasClick);
			document.removeEventListener('mousedown', this.binded.onMouseDown);
			document.removeEventListener('mouseup', this.binded.onMouseUp);

			this.createCanvas();
		}.bind(this), 500);
	};

	AutomateCtrl.prototype.run = function run() {
		runTimeoutPromise = $timeout(function () {
			this.step().then(function () {
				if (!automate.stopped) {
					this.run();
				}
			}.bind(this));
		}.bind(this), this.timeoutMs);
	};

	AutomateCtrl.prototype.createCanvas = function createCanvas() {
		this.canvas = document.querySelector('.automate-canvas');
		this.canvas.width = this.cellsCount * this.canvasRatio;
		this.canvas.height = this.rowsCount * this.canvasRatio;
		this.ctx = this.canvas.getContext('2d');
		this.ctx.strokeStyle = '#efefef';
		this.updateWholeCanvas(automate.statesView);

		this.canvas.addEventListener('click', this.binded.onCanvasClick);
		document.addEventListener('mousedown', this.binded.onMouseDown);
		document.addEventListener('mouseup', this.binded.onMouseUp);
	};

	AutomateCtrl.prototype.updateWholeCanvas = function updateWholeCanvas(data) {
		console.time('updateWholeCanvas');
		var i = 0,
			rowIndex = 0,
			cellIndex = 0;
		while (i < data.length) {
			//draw cell borders
			this.ctx.strokeRect(cellIndex * this.canvasRatio, rowIndex * this.canvasRatio, this.canvasRatio, this.canvasRatio);
			//fill cells with color
			this.updateCanvasCell(data[i], cellIndex, rowIndex);
			i++;
			cellIndex = i % this.cellsCount;
			if (cellIndex === 0) {
				rowIndex++;
			}
		}
		console.timeEnd('updateWholeCanvas');
	};

	AutomateCtrl.prototype.onUpdateView = function onUpdateView(value, index) {
		this.updateCanvasCell(value, index % this.cellsCount, Math.floor(index / this.cellsCount));
	};

	AutomateCtrl.prototype.updateCanvasCell = function updateCanvasCellAutomateCtrl(value, x, y) {
		this.ctx.fillStyle = value ? '#7eeafe' : '#FFFFFF';
		this.ctx.fillRect(x * this.canvasRatio + 1, y * this.canvasRatio + 1, this.cellSize, this.cellSize);
	};

	AutomateCtrl.prototype.onCanvasClick = function onCanvasClick(event, write) {
		var rowsIndex = Math.floor(event.layerY / this.canvasRatio),
			cellsIndex = Math.floor(event.layerX / this.canvasRatio),
			index = rowsIndex * this.cellsCount + cellsIndex,
			cell = automate.statesView[index];
		automate.statesView[index] = cell = write ? 1 : (cell === 1 ? 0 : 1);
		this.updateCanvasCell(cell, cellsIndex, rowsIndex);
	};

	AutomateCtrl.prototype.onMouseMove = function onMouseMove(event) {
		this.onCanvasClick(event, true);
	};

	AutomateCtrl.prototype.onMouseDown = function onMouseDown() {
		this.canvas.addEventListener('mousemove', this.binded.onMouseMove);
	};
	AutomateCtrl.prototype.onMouseUp = function onMouseUp() {
		this.canvas.removeEventListener('mousemove', this.binded.onMouseMove);
	};

	AutomateCtrl.$inject = ['$timeout'];

	angular.module('app').controller('AutomateCtrl', AutomateCtrl);
})();