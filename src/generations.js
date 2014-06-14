(function(){
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
	lastActorId: 0,

	typeData: {
		'100': {
			color: '#11ee11',
			dieAfter: 2,
			birthFriends: 1,
			birthRate: 0.76,
			maxResource: 100,
			childResource: 8,
			availableCellsString: '1',
			availableCells: [1],
			killString: '',
			kill: []
		},
		'101': {
			color: '#cc6633',
			dieAfter: 1,
			birthFriends: 1,
			birthRate: 0.75,
			maxResource: 200,
			childResource: 50,
			availableCellsString: '100 1',
			availableCells: [100, 1],
			killString: '100',
			kill: [100]
		}
	},

	stepPlain: function () {
		console.time('plain');
		this.epoch++;
		return new Promise(function (resolve) {
			var result = this.process({
				statesView: this.statesView, 
				actors: this.actors,
				typeData: this.typeData,
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
		var statesView = data.statesView,
			changedCells = [],
			index, currentCell, currentActor;

		for (var actorId in data.actors) {
			var actor = data.actors[actorId];
			var topRowIndex = actor.coordinate - data.width;
			var bottomRowIndex = actor.coordinate + data.width;

			// erase value on old actor coordinate
			changedCells.push(1);
			changedCells.push(actor.coordinate);

			if (actor.resource === 0) {
				delete data.actors[actorId];
				continue;
			}

			actor.resource--;

			var typeData = data.typeData[actor.type];
			var environment = new Uint16Array([topRowIndex-1, topRowIndex, topRowIndex+1, actor.coordinate+1, bottomRowIndex+1, bottomRowIndex, bottomRowIndex-1, actor.coordinate-1]);
			var availableCells = [];
			var destinationIndex = -1;
			var friends = 0;
			for (var i in environment) {
				index = environment[i];
				currentCell = statesView[index];
				if (typeData.availableCells.indexOf(currentCell) !== -1) {
					availableCells.push(index);
				}
				currentActor = data.actors[currentCell];
				if (currentActor) {
					if (typeData.kill.indexOf(currentActor.type) !== -1) {
						destinationIndex = index;
						actor.resource = typeData.maxResource;
						delete data.actors[currentCell];
						break;
					} 
					if (currentActor.type === actor.type) {
						friends++;
					}
				}
			}


			if (friends === typeData.birthFriends && Math.random() > typeData.birthRate) {
				actor.resource = typeData.maxResource;
				data.actors[this.lastActorId++] = {
					coordinate: actor.coordinate,
					type: actor.type,
					resource: typeData.childResource
				};
			} else if (friends > typeData.dieAfter) {
				statesView[actor.cordinate] = 1;
				delete data.actors[actorId];
				continue;
			}

			// move
			if (destinationIndex === -1) {
				destinationIndex = availableCells[Math.floor(Math.random()*(availableCells.length))];			
			}

			changedCells.push(actorId);
			changedCells.push(destinationIndex);
			// update actor's coordinate
			actor.coordinate = destinationIndex;
			statesView[actor.coordinate] = actorId;

		}
		return {changesBuffer: new Uint32Array(changedCells).buffer};
	},

	createMatrix: function createMatrixGenerations(rowsCount, cellsCount, random, actorsCount) {
		this.length = rowsCount*cellsCount;
		this.height = rowsCount;
		this.width = cellsCount;

		// create world with random objects (0 - empty space, 1 - object)
		this.statesBuffer = new ArrayBuffer(this.length*2);
		this.statesView = new Uint16Array(this.statesBuffer);
		for (var i = 0; i < this.length; i++) {
			this.statesView[i] = random ? Math.floor(0.6 + Math.random()) : 1;
		}

		this.actors = {};

		if (random && actorsCount) {
			this.lastActorId = 100;
			actorsCount+=100;
			// create live actors
			while (this.lastActorId < actorsCount) {
				var type  = random ? Actor.HAMSTER + Math.round(Math.random()*0.56) : Actor.HAMSTER;
				var resource = type === Actor.HUNTER ? 200 : 100;
				this.actors[this.lastActorId] = new Actor(0, type, resource);
				this.lastActorId++;
			}
			// put actors to the world randomly
			var placedActorId = 100; i = 100;
			while (placedActorId !== actorsCount) {
				if (this.statesView[i] === 0 && Math.random() < 0.03) {
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

var Actor = function (coordinate, type, resource) {
	this.coordinate = coordinate;
	this.type = type;
	this.resource = resource || 90;
};
Actor.HUNTER = 101;
Actor.HAMSTER = 100;
})();
