(function() {
	var canvasData;
	function CanvasService(canvasDataObject) {
		this.canvasData = canvasData = canvasDataObject;
		this.automate = {};//this parameter sets in controller
		this.binded = {
			onMouseMove: this.onMouseMove.bind(this),
			onMouseDown: this.onMouseDown.bind(this),
			onMouseUp: this.onMouseUp.bind(this),
			onCanvasClick: this.onCanvasClick.bind(this)
		};
	}

	CanvasService.prototype.createCanvas = function createCanvas() {
		canvasData.canvas = document.querySelector('.automate-canvas');
		canvasData.canvas.width = canvasData.cellsCount * canvasData.canvasRatio;
		canvasData.canvas.height = canvasData.rowsCount * canvasData.canvasRatio;
		this.ctx = canvasData.canvas.getContext('2d');
		this.ctx.strokeStyle = '#efefef';
		this.updateWholeCanvas(this.automate.statesView);

		//canvasData.canvas.addEventListener('click', this.binded.onCanvasClick);
		document.addEventListener('mousedown', this.binded.onMouseDown);
		document.addEventListener('mouseup', this.binded.onMouseUp);
	};

	CanvasService.prototype.changeSize = function changeSize() {
		canvasData.cellSize = canvasData.canvasRatio - 2;
		//canvasData.canvas.removeEventListener('click', this.binded.onCanvasClick);
		document.removeEventListener('mousedown', this.binded.onMouseDown);
		document.removeEventListener('mouseup', this.binded.onMouseUp);

		this.createCanvas();
	};
	
	CanvasService.prototype.updateWholeCanvas = function updateWholeCanvas(data) {
		console.time('updateWholeCanvas');
		var i = 0,
			rowIndex = 0,
			cellIndex = 0;
		while (i < data.length) {
			//draw cell borders
			this.ctx.strokeRect(cellIndex * canvasData.canvasRatio, rowIndex * canvasData.canvasRatio, canvasData.canvasRatio, canvasData.canvasRatio);
			//fill cells with color
			this.updateCanvasCell(data[i], cellIndex, rowIndex);
			i++;
			cellIndex = i % canvasData.cellsCount;
			if (cellIndex === 0) {
				rowIndex++;
			}
		}
		console.timeEnd('updateWholeCanvas');
	};

	CanvasService.prototype.onUpdateView = function onUpdateView(value, index) {
		this.updateCanvasCell(value, index % canvasData.cellsCount, Math.floor(index / canvasData.cellsCount));
	};

	CanvasService.prototype.lifeStyles = {
		'0': '#7eeafe',
		'1': '#ffffff'
	};
	CanvasService.prototype.updateCanvasCellLife = function updateCanvasCellAutomateCtrl(value, x, y) {
		this.ctx.fillStyle = this.lifeStyles[value];
		this.ctx.fillRect(x * canvasData.canvasRatio + 1, y * canvasData.canvasRatio + 1, canvasData.cellSize, canvasData.cellSize);
	};

	CanvasService.prototype.generationStyles = {
		'0': '#7eeafe',
		'1': '#ffffff'
	};
	CanvasService.prototype.updateCanvasCellGenerations = function updateCanvasCellAutomateCtrl(value, x, y) {
		var actor = this.automate.actors[value];
		if (actor) {
			this.ctx.fillStyle = this.automate.typeData[actor.type].color;
		} else {
			this.ctx.fillStyle = this.generationStyles[value];
		}
		this.ctx.fillRect(x * canvasData.canvasRatio + 1, y * canvasData.canvasRatio + 1, canvasData.cellSize, canvasData.cellSize);
	};

	CanvasService.prototype.onCanvasClick = function onCanvasClick(event, write) {
		var rowsIndex = Math.floor(event.layerY / canvasData.canvasRatio),
			cellsIndex = Math.floor(event.layerX / canvasData.canvasRatio),
			index = rowsIndex * canvasData.cellsCount + cellsIndex,
			cell = this.automate.statesView[index];
		this.automate.statesView[index] = cell = write ? 1 : (cell === 1 ? 0 : 1);
		this.updateCanvasCell(cell, cellsIndex, rowsIndex);
	};

	CanvasService.prototype.onMouseMove = function onMouseMove(event) {
		this.onCanvasClick(event, true);
	};

	CanvasService.prototype.onMouseDown = function onMouseDown() {
		canvasData.canvas.addEventListener('mousemove', this.binded.onMouseMove);
	};
	CanvasService.prototype.onMouseUp = function onMouseUp() {
		canvasData.canvas.removeEventListener('mousemove', this.binded.onMouseMove);
	};
	
	CanvasService.$inject = ['canvasData'];
	
	angular.module('app').service('canvasService', CanvasService);
})();
