'use strict';

var _ = require('lodash');

var Stateus = function(states, initialState, context) {
	if (_.isEmpty(states)) {
		throw new Error('No states defined');
	}

	if (typeof states[initialState] === 'undefined') {
		throw new Error('No such initial state');
	}

	if (typeof context === 'undefined') {
		context = this;
	}

	this.states              = states;
	this.context             = context;
	this.currentState        = initialState;
	this.transitionCallbacks = [];
	this.setupInvalidTransitions();
	this.createStateMethods(initialState);
};

Stateus.prototype.context             = null;
Stateus.prototype.currentState        = '';
Stateus.prototype.states              = {};
Stateus.prototype.transitionCallbacks = [];

Stateus.prototype.setupInvalidTransitions = function() {
	var self = this;
	_.each(this.states, function(state) {
		_.each(state, function(stateName, transitionName){
			self[transitionName] = function() {
				console.log('No such transition ("' + transitionName + '") for this state ("' + stateName + '").');
			};
		});
	});
};

Stateus.prototype.switchState = function(newState) {
	if (typeof this.states[newState] === 'undefined') {
		throw new Error('No such state ("' + newState + '")');
	}

	this.setupInvalidTransitions();
	this.createStateMethods(newState);

	var oldState = this.currentState;
	this.currentState = newState;
	this.runTransitionCallbacks('*', '*', [oldState, newState]); // from any to any
	this.runTransitionCallbacks(oldState, newState, [oldState, newState]); // from specific - to specific
	this.runTransitionCallbacks(oldState, '*', [newState]); // from specific - to any
	this.runTransitionCallbacks('*', newState, [oldState]); // from any - to specific

	return this;
};

Stateus.prototype.runTransitionCallbacks = function(oldState, newState, actualStates) {
	if (typeof this.transitionCallbacks[oldState] === 'undefined' || typeof this.transitionCallbacks[oldState][newState] === 'undefined') {
		return false;
	}

	var self = this;
	_.each(this.transitionCallbacks[oldState][newState], function(callback) {
		callback.apply(self.context, actualStates);
	});
};

Stateus.prototype.setState = function (newState) {
	if (typeof this.states[newState] === 'undefined') {
		throw new Error('No such state ("' + newState + '")');
	}

	this.currentState = newState;

	return this;
};

Stateus.prototype.createStateMethods = function(newState) {
	var self = this;

	if (typeof this.states[newState] === 'undefined') {
		return false;
	}

	_.each(this.states[newState], function(returnValue, transitionName) {
		if (typeof Stateus.prototype[transitionName] !== 'undefined') {
			throw new Error('Reserved name. Cannot use "' + transitionName + '" for a transition name.');
		}

		self[transitionName] = function() {
			var response     = false;
			if (typeof returnValue === 'function') {
				var newState = returnValue.apply(self.context, _.values(arguments));
				response = self.switchState(newState.toString());
			} else {
				response = self.switchState(returnValue);
			}
			return response;
		};
	});
};

Stateus.prototype._onTransition = function(oldState, newState, callback) {
	var self = this;
	if (typeof oldState !== 'string') {
		_.each(oldState, function(eachOldState){
			self._onTransition(eachOldState, newState, callback);
		});
		return;
	}

	if (typeof this.transitionCallbacks[oldState] === 'undefined') {
		this.transitionCallbacks[oldState] = {};
	}

	if (typeof newState === 'string') {
		newState = [newState];
	}

	_.each(newState, function(eachNewState) {
		if (typeof self.transitionCallbacks[oldState][eachNewState] === 'undefined') {
			self.transitionCallbacks[oldState][eachNewState] = [];
		}
		self.transitionCallbacks[oldState][eachNewState].push(callback);
	});
};

Stateus.prototype.onTransition = function(callback) {
	this._onTransition('*', '*', callback);
};

Stateus.prototype.onTransitionTo = function(newState, callback) {
	this._onTransition('*', newState, callback);
};

Stateus.prototype.onTransitionFrom = function(oldState, callback) {
	this._onTransition(oldState, '*', callback);
};

Stateus.prototype.onTransitionFromTo = function(oldState, newState, callback) {
	this._onTransition(oldState, newState, callback);
};

module.exports = Stateus;
