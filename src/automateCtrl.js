/* global life, angular, generations*/

(function () {
	var $timeout,
		runTimeoutPromise,
		changeSizePromise,
		canvasData,
		canvasService;
	
	var AutomateCtrl = function ($timeoutInstance, canvasServiceObject) {
		$timeout = $timeoutInstance;

		// 0 - life, 1 - generations
		this.mode = 0;

		this.actorsCount = 500;
		this.timeoutMs = 0;
		this.canvasData = canvasData = canvasServiceObject.canvasData;
		this.automate = life;
		canvasService = canvasServiceObject;
		canvasService.automate = this.automate;
		canvasData.rowsCount = 30;
		canvasData.cellsCount = 40;
		canvasData.canvasRatio = 15;
		canvasData.cellSize = canvasData.canvasRatio - 2;

		this.showSettings = true;
		
		this.automate.initWorkers(4);
		this.useWorkers = true;
		this.toggleStepLogic();
		this.toggleModeLogic(true);

		life.createMatrix(canvasData.rowsCount, canvasData.cellsCount, true, this.actorsCount);
		generations.createMatrix(canvasData.rowsCount, canvasData.cellsCount, true, this.actorsCount);

		canvasService.createCanvas();
	};

	AutomateCtrl.prototype.startLogic = function startLogic() {
		$timeout.cancel(runTimeoutPromise);
		this.automate.stopped = false;
		this.step();
		this.run();
	};

	AutomateCtrl.prototype.step = function step() { };

	AutomateCtrl.prototype.toggleModeLogic = function toggleModeLogic(firstTime) {
		this.stopLogic();
		if (this.mode === 0) {
			this.automate = life;
			canvasService.updateCanvasCell = canvasService.updateCanvasCellLife;
		} else {
			this.automate = generations;
			canvasService.updateCanvasCell = canvasService.updateCanvasCellGenerations;
		}
		canvasService.automate = this.automate;
		this.automate.updateView = canvasService.onUpdateView.bind(canvasService);
		this.toggleStepLogic();
		if (!firstTime) {
			canvasService.updateWholeCanvas(this.automate.statesView);
		}
	};

	AutomateCtrl.prototype.toggleStepLogic = function toggleStepLogic() {
		if (this.useWorkers) {
			this.step = this.automate.stepWorkers.bind(this.automate);
		} else {
			this.step = this.automate.stepPlain.bind(this.automate);
		}
	};

	AutomateCtrl.prototype.stopLogic = function stopLogic() {
		this.automate.stopped = true;
		$timeout.cancel(runTimeoutPromise);
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
		canvasService.updateWholeCanvas(this.automate.createMatrix(canvasData.rowsCount, canvasData.cellsCount, false, this.actorsCount));
		this.automate.epoch = 0;
	};

	AutomateCtrl.prototype.randomMatrix = function randomMatrix() {
		this.stopLogic();
		canvasService.updateWholeCanvas(this.automate.createMatrix(canvasData.rowsCount, canvasData.cellsCount, true, this.actorsCount));
		this.automate.epoch = 0;
	};


	AutomateCtrl.prototype.changeSize = function changeSize() {
		$timeout.cancel(changeSizePromise);

		changeSizePromise = $timeout(function () {
			this.stopLogic();
			this.automate.createMatrix(canvasData.rowsCount, canvasData.cellsCount, false, this.actorsCount);
			canvasService.changeSize();
		}.bind(this), 500);
	};

	AutomateCtrl.prototype.run = function run() {
		runTimeoutPromise = $timeout(function () {
			this.step().then(function () {
				if (!this.automate.stopped) { this.run(); }
			}.bind(this));
		}.bind(this), this.timeoutMs);
	};

	AutomateCtrl.$inject = ['$timeout', 'canvasService'];

	angular.module('app').controller('AutomateCtrl', AutomateCtrl);
})();
