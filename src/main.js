var AutomateCtrl = function ($timeout, $scope) {
	this.rowsCount = 75;
	this.cellsCount = 130;
	
	this.$scope = $scope;
	this.$timeout = $timeout;
	this.timeoutObj = {};
	this.timeoutMs = 100;
	this.started = true;
	
	this.automate = automate;
	automate.initWorkers();
	
	this.useWorkers = true;
	this._step = this.automate.stepWorkers.bind(this.automate);
	
	this.rule = {
		born: [3],
		save: [2,3]
	};
	
	this.automate.createMatrix(this.rowsCount, this.cellsCount, this.rule, true);
	
	this.createTable();
};

AutomateCtrl.prototype.startLogic = function startLogicAutomateCtrl() {
	clearTimeout(this.timeoutObj.$$timeoutId);
	this.started = true;
	this.step();
	this.run();
};

AutomateCtrl.prototype.step = function stepAutomateCtrl() {
	return this._step().then(function (changedCells) {
		if (this.started) {
			this.updateTable(changedCells);
		}
		return true;
	}.bind(this));
};

AutomateCtrl.prototype.toggleStepLogic = function toggleStepLogicAutomateCtrl() {
	if (this.useWorkers) {
		this._step = this.automate.stepWorkers.bind(this.automate);
	} else {
		this._step = this.automate.stepPlain.bind(this.automate);
	}
};

AutomateCtrl.prototype.stopLogic = function stopLogicAutomateCtrl() {
	this.started = false;
	clearTimeout(this.timeoutObj.$$timeoutId);
};

AutomateCtrl.prototype.processStep = function processStepAutomateCtrl() {
	this.stopLogic();
	this.step();
};

AutomateCtrl.prototype.clearMatrix = function clearMatrixAutomateCtrl() {
	this.stopLogic();
	this.updateTable(this.automate.createMatrix(this.rowsCount, this.cellsCount, this.rule, false), true);
};

AutomateCtrl.prototype.randomMatrix = function randomMatrixAutomateCtrl() {
	this.stopLogic();
	this.updateTable(this.automate.createMatrix(this.rowsCount, this.cellsCount, this.rule, true), true);
};

AutomateCtrl.prototype.run = function runAutomateCtrl() {
	this.timeoutObj = this.$timeout(function () {
		this.step().then(function () {
			if (this.started) {
				this.run();
			}
		}.bind(this));
	}.bind(this), this.timeoutMs);
};

AutomateCtrl.prototype.createTable = function createTableAutomateCtrl() {
	this.table = document.querySelector('.automate-table');
	
	this.automate.matrix.forEach(function (row, iRow) {
		var tr = this.table.insertRow(iRow);
		tr.className = 'automate-table__row';
		row.forEach(function (cell, iCell) {
			var td = this.table.rows[iRow].insertCell(iCell);
			td.iRow = iRow;
			td.iCell = iCell;
			td.state = cell.state;
			td.className = 'automate-table__cell ' + (td.state === 0 ? 'cell_empty' : 'cell_filled');
		}, this);
	}, this);

	this.table.addEventListener('click', this.onTableClick.bind(this))
};

AutomateCtrl.prototype.updateTable = function updateTableAutomateCtrl(changedCells, isMatrix) {
	if (isMatrix) {
		for (var i = 0, len1 = changedCells.length; i < len1; i++) {
			for (var j = 0, len2 = changedCells[i].length; j < len2; j++) {
				var changedCell = changedCells[i][j],
					td = this.table.rows[changedCell.i].cells[changedCell.j];
				this.changeCellState(td, changedCell.state)
			}
		}
	} else {
		for (i = 0, len1 = changedCells.length; i < len1; i++) {
			changedCell = changedCells[i];
			td = this.table.rows[changedCell.i].cells[changedCell.j];
			this.changeCellState(td, changedCell.state)
		}
	}
};
AutomateCtrl.prototype.changeCellState = function changeCellStateAutomateCtrl(td, state) {
	if (state !== td.state) {
		td.state = state;
		//requestAnimationFrame(function () {
			if (state) {
				td.classList.remove('cell_empty');
				td.classList.add('cell_filled');
			} else {
				td.classList.add('cell_empty');
				td.classList.remove('cell_filled');
			}
		//}, this.table);
	}
};

AutomateCtrl.prototype.onTableClick = function onTableClickAutomateCtrl(event) {
	var td = event.target;
	if (td.tagName !== 'TD') { 
		return; 
	}
	this.changeCellState(td, td.state === 1 ? 0 : 1);
	this.automate.matrix[td.iRow][td.iCell].state = td.state;
};

AutomateCtrl.$inject = ['$timeout', '$scope'];

angular.module('app', []);
angular.module('app').controller('AutomateCtrl', AutomateCtrl);



