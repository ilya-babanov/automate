var AutomateCtrl = function ($timeout, $scope) {
	this.rowsCount = 180;
	this.cellsCount = 300;

	this.$scope = $scope;
	this.$timeout = $timeout;
	this.timeoutObj = {};
	this.timeoutMs = 20;

	this.canvasRatio = 6;
	this.binded = {
		onMouseMove: this.onMouseMove.bind(this)
	};
	
	this.automate = automate;
	automate.initWorkers(6);
	automate.updateView = this.onUpdateView.bind(this);
	this.useWorkers = true;
	this.toggleStepLogic();

	this.rule = {
		born: [3],
		save: [2,3]
	};

	this.automate.createMatrix(this.rowsCount, this.cellsCount, this.rule, true);

	this.createCanvas();
};

AutomateCtrl.prototype.startLogic = function startLogic() {
	clearTimeout(this.timeoutObj.$$timeoutId);
	this.automate.stopped = false;
	this.step();
	this.run();
};

AutomateCtrl.prototype.step = function step() {};

AutomateCtrl.prototype.toggleStepLogic = function toggleStepLogic() {
	if (this.useWorkers) {
		this.step = this.automate.stepWorkers.bind(this.automate);
	} else {
		this.step = this.automate.stepPlain.bind(this.automate);
	}
};

AutomateCtrl.prototype.stopLogic = function stopLogic() {
	this.automate.stopped = true;
	clearTimeout(this.timeoutObj.$$timeoutId);
};

AutomateCtrl.prototype.processStep = function processStep() {
	this.stopLogic();
	this.automate.stopped = false;
	this.step().then(function () {
		this.automate.stopped = true;
	}.bind(this));
};

AutomateCtrl.prototype.clearMatrix = function clearMatrix() {
	this.stopLogic();
	this.updateWholeCanvas(this.automate.createMatrix(this.rowsCount, this.cellsCount, this.rule, false));
	this.automate.epoch = 0;
};

AutomateCtrl.prototype.randomMatrix = function randomMatrix() {
	this.stopLogic();
	this.updateWholeCanvas(this.automate.createMatrix(this.rowsCount, this.cellsCount, this.rule, true));
	this.automate.epoch = 0;
};

AutomateCtrl.prototype.run = function run() {
	this.timeoutObj = this.$timeout(function () {
		this.step().then(function () {
			if (!this.automate.stopped) {
				this.run();
			}
		}.bind(this));
	}.bind(this), this.timeoutMs);
};

AutomateCtrl.prototype.createCanvas = function createCanvas() {
	this.canvas = document.querySelector('.automate-canvas');
	this.canvas.width = this.cellsCount*this.canvasRatio;
	this.canvas.height = this.rowsCount*this.canvasRatio;
	this.ctx = this.canvas.getContext('2d');
	this.ctx.strokeStyle = '#efefef';
	this.updateWholeCanvas(this.automate.statesView);
	this.canvas.addEventListener('click', this.onCanvasClick.bind(this));
	
	document.addEventListener('mousedown', this.onMouseDown.bind(this));
	document.addEventListener('mouseup', this.onMouseUp.bind(this));
};

AutomateCtrl.prototype.updateWholeCanvas = function updateWholeCanvas(data) {
	console.time('updateWholeCanvas');
	var i = 0,
		rowIndex = 0,
		cellIndex = 0;
	while (i < data.length) {
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
	this.updateCanvasCell(value, index%this.cellsCount, Math.floor(index/this.cellsCount));
};

AutomateCtrl.prototype.updateCanvasCell = function updateCanvasCellAutomateCtrl(value, x, y) {
	this.ctx.fillStyle = value ? '#7eeafe' : '#FFFFFF';
	this.ctx.fillRect(x*this.canvasRatio, y*this.canvasRatio, this.canvasRatio, this.canvasRatio);
	this.ctx.strokeRect(x*this.canvasRatio, y*this.canvasRatio, this.canvasRatio, this.canvasRatio);
};

AutomateCtrl.prototype.onCanvasClick = function onCanvasClick(event, write) {
	var rowsIndex = Math.floor(event.layerY/this.canvasRatio),
		cellsIndex = Math.floor(event.layerX/this.canvasRatio),
		index = rowsIndex*this.cellsCount + cellsIndex,
		cell = this.automate.statesView[index];
	this.automate.statesView[index] = cell = write ? 1 : (cell === 1 ? 0 : 1);
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

AutomateCtrl.$inject = ['$timeout', '$scope'];

angular.module('app', []);
angular.module('app').controller('AutomateCtrl', AutomateCtrl);



