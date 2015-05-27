'use strict';

var _ = require('lodash');

var Murica = function(states, initialState, context) {
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

	var self = this;
	_.each(this.states, function(state) {
		_.each(state, function(returnValue, transitionName){
			self[transitionName] = function() {
				console.log('No such transition for this state.');
			};
		});
	});

	this.setupInvalidTransitions();
	this.createStateMethods(initialState);
};

Murica.prototype.context             = null;
Murica.prototype.currentState        = '';
Murica.prototype.states              = {};
Murica.prototype.transitionCallbacks = [];

Murica.prototype.setupInvalidTransitions = function() {
	var self = this;
	_.each(this.states, function(state) {
		_.each(state, function(returnValue, transitionName){
			self[transitionName] = function() {
				console.log('No such transition for this state.');
			};
		});
	});
};

Murica.prototype.switchState = function(newState) {
	if (typeof this.states[newState] === 'undefined') {
		throw new Error('No such state');
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

Murica.prototype.runTransitionCallbacks = function(oldState, newState, actualStates) {
	if (typeof this.transitionCallbacks[oldState] === 'undefined' || typeof this.transitionCallbacks[oldState][newState] === 'undefined') {
		return false;
	}

	var self = this;
	_.each(this.transitionCallbacks[oldState][newState], function(callback) {
		callback.apply(self.context, actualStates);
	});
};

Murica.prototype.setState = function (newState) {
	if (typeof this.states[newState] === 'undefined') {
		throw new Error('No such state');
	}

	this.currentState = newState;

	return this;
};

Murica.prototype.createStateMethods = function(newState) {
	var self = this;

	if (typeof this.states[newState] === 'undefined') {
		return false;
	}

	_.each(this.states[newState], function(returnValue, transitionName) {
		if (typeof Murica.prototype[transitionName] !== 'undefined') {
			throw new Error('Reserved name. Cannot use ' + transitionName + ' for transition.');
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

Murica.prototype.onTransition = function(oldState, newState, callback) {
	var self = this;
	if (typeof oldState !== 'string') {
		_.each(oldState, function(eachOldState){
			self.onTransition(eachOldState, newState, callback);
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

Murica.prototype.bind = function(callback) {
	this.onTransition('*', '*', callback);
};

Murica.prototype.onTransitionTo = function(newState, callback) {
	this.onTransition('*', newState, callback);
};

Murica.prototype.onTransitionFrom = function(oldState, callback) {
	this.onTransition(oldState, '*', callback);
};

Murica.prototype.onTransitionFromTo = function(oldState, newState, callback) {
	this.onTransition(oldState, newState, callback);
};

module.exports = Murica;
