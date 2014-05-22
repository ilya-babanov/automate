(function () {
	var $timeout,
		runTimeoutPromise,
		changeSizePromise,
		canvasData,
		canvasService;
	
	var AutomateCtrl = function ($timeoutInstance, canvasServiceObject) {
		$timeout = $timeoutInstance;
		this.timeoutMs = 10;
		this.canvasData = canvasData = canvasServiceObject.canvasData;
		this.automate = automate;
		canvasService = canvasServiceObject;
		
		canvasData.rowsCount = 20;
		canvasData.cellsCount = 40;
		canvasData.canvasRatio = 22;
		canvasData.cellSize = canvasData.canvasRatio - 2;
		



		automate.initWorkers(6);
		automate.updateView = canvasService.onUpdateView.bind(canvasService);
		this.useWorkers = true;
		this.toggleStepLogic();

		this.rule = {
			born: [3],
			save: [2, 3]
		};

		automate.createMatrix(canvasData.rowsCount, canvasData.cellsCount, this.rule, true);

		canvasService.createCanvas();
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
		canvasService.updateWholeCanvas(automate.createMatrix(canvasData.rowsCount, canvasData.cellsCount, this.rule, false));
		automate.epoch = 0;
	};

	AutomateCtrl.prototype.randomMatrix = function randomMatrix() {
		this.stopLogic();
		canvasService.updateWholeCanvas(automate.createMatrix(canvasData.rowsCount, canvasData.cellsCount, this.rule, true));
		automate.epoch = 0;
	};


	AutomateCtrl.prototype.changeSize = function changeSize() {
		$timeout.cancel(changeSizePromise);

		changeSizePromise = $timeout(function () {
			this.stopLogic();
			automate.createMatrix(canvasData.rowsCount, canvasData.cellsCount, this.rule, false);
			canvasService.changeSize();
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

	AutomateCtrl.$inject = ['$timeout', 'canvasService'];

	angular.module('app').controller('AutomateCtrl', AutomateCtrl);
})();