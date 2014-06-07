window.generations = {
	epoch: 0,
	stopped: true,
	
	length: 0,
	height: 0,
	width: 0,
	
	workers: [],
	statesBuffer: null,
	statesView: null,

	actors: {},

	stepPlain: function () {
		console.time('plain');
		this.epoch++;
		return new Promise(function (resolve) {
			var result = this.process({
				statesBuffer: this.statesBuffer, 
				actors: this.actors,
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

	process: function (data) {
		var statesView = new Uint8Array(data.statesBuffer),
			actor = null, changedCells = [],
			availableCells, index, currentCell,
			destinationIndex, topRowIndex, bottomRowIndex;

		for (var actorId in data.actors) {
			actor = data.actors[actorId];
			topRowIndex = actor.coordinate - data.width;
			bottomRowIndex = actor.coordinate + data.width;
			availableCells = [];

			currentCell = statesView[topRowIndex-1];
			if (currentCell !== 0 && currentCell !== undefined) {
				availableCells.push(topRowIndex-1);
			}
			currentCell = statesView[topRowIndex];
			if (currentCell !== 0 && currentCell !== undefined) {
				availableCells.push(topRowIndex);
			}
			currentCell = statesView[topRowIndex+1];
			if (currentCell !== 0 && currentCell !== undefined) {
				availableCells.push(topRowIndex+1);
			}
			currentCell = statesView[actor.coordinate+1];
			if (currentCell !== 0 && currentCell !== undefined) {
				availableCells.push(actor.coordinate+1);
			}
			currentCell = statesView[bottomRowIndex+1];
			if (currentCell !== 0 && currentCell !== undefined) {
				availableCells.push(bottomRowIndex+1);
			}
			currentCell = statesView[bottomRowIndex];
			if (currentCell !== 0 && currentCell !== undefined) {
				availableCells.push(bottomRowIndex);
			}
			currentCell = statesView[bottomRowIndex-1];
			if (currentCell !== 0 && currentCell !== undefined) {
				availableCells.push(bottomRowIndex-1);
			}
			currentCell = statesView[actor.coordinate-1];
			if (currentCell !== 0 && currentCell !== undefined) {
				availableCells.push(actor.coordinate-1);
			}

			//console.log('availableCells', availableCells);
			// select direction
			destinationIndex = availableCells[Math.floor(Math.random()*(availableCells.length))];
			switch (actor.type) {
				case 101:
					for (var i = 1, l = availableCells.length; i < l; i ++) {
						index = availableCells[i];
						currentCell = statesView[index];
						if (data.actors[currentCell] && data.actors[currentCell].type === 100) {
							destinationIndex = index;
							delete data.actors[currentCell];
						}
					}
					break;
			}
			// erase value on old actor coordinate
			changedCells.push(1);
			changedCells.push(actor.coordinate);

			// move
			changedCells.push(actorId);
			changedCells.push(destinationIndex);

			// update actor's coordinate
			actor.coordinate = destinationIndex;
		}
		return {changesBuffer: new Uint32Array(changedCells).buffer};
	},

	createMatrix: function createMatrixGenerations(rowsCount, cellsCount, random, actorsCount) {
		this.length = rowsCount*cellsCount;
		this.height = rowsCount;
		this.width = cellsCount;

		// create world with random objects (0 - empty space, 1 - object)
		this.statesBuffer = new ArrayBuffer(this.length);
		this.statesView = new Uint8Array(this.statesBuffer);
		for (var i = 0; i < this.length; i++) {
			this.statesView[i] = random ? Math.round(Math.random()) : 1;
		}

		if (random && actorsCount) {
			i = 100;
			actorsCount+=100;
			// create live actors
			while (i < actorsCount) {
				var actor = {
					//id: i,
					type:  random ? 100 + Math.round(Math.random()*0.75) : 100,
					resources: 100,
					coordinate: 0
				};
				this.actors[i] = actor;
				i++;
			}
			// put actors to the world randomly
			var placedActorId = 100; i = 100;
			while(placedActorId !== actorsCount) {
				if (this.statesView[i] === 0 && Math.random() < 0.06) {
					// put actor in a world writing his id into the states view
					this.statesView[i] = placedActorId;
					// set coordinate to actor
					this.actors[placedActorId].coordinate = i;
					placedActorId++;
				}
				i++;
				if (i === this.length) {
					i = 0;
				}
			}
			console.log('actors', this.actors);
		}
		console.log('world', this.statesView);
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

// temporary (temporary, heh!)  make stepWorkers similar to stepPlain
window.generations.stepWorkers = window.generations.stepPlain;
