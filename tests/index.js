'use strict';

var should  = require('chai').should();
var expect  = require('chai').expect;
var assert  = require('chai').assert;
var _       = require('lodash');
var Stateus = require('../stateus.js');

var transitionFunction = function() {
	return 'four';
};
var exampleStates = {
	one: {
		increment: 'two'
	},
	two: {
		increment: 'three',
		decrement: function() {
			return 'one';
		},
		goToFour: transitionFunction()
	},
	three: {
		increment: 'four',
		decrement: 'two'
	},
	four: {
		increment: 'one',
		decrement: 'three'
	}
};

describe('state machine initialization', function () {
	it('should give an error on no states defined', function () {
		var constructor = function() {
			return new Stateus({}, 'one');
		};
		expect(constructor).to.throw(Error);
	});

	it('should give an error on no initial state defined', function () {
		var constructor = function() {
			return new Stateus(exampleStates);
		};
		expect(constructor).to.throw(Error);
	});

	it('should save the states names list', function () {
		var machine = new Stateus(exampleStates, 'one');
		var stateNames = _.keys(exampleStates);
		expect(machine.states).to.have.all.keys(stateNames);
	});
});

describe('state machine transitions and bindings', function () {
	var machine;

	beforeEach(function(){
		machine = new Stateus(exampleStates, 'two');
	});

	describe('state switching', function () {
		it('should switch correctly when transition defines destination state name as a string', function () {
			machine.currentState.should.equal('two');
			machine.increment().currentState.should.equal('three');
		});

		it('should switch correctly when transition defines destination state name as a closure', function () {
			machine.currentState.should.equal('two');
			machine.decrement().currentState.should.equal('one');
		});

		it('should switch correctly when transition defines destination state name as a function', function () {
			machine.currentState.should.equal('two');
			machine.goToFour().currentState.should.equal('four');
		});

		it('should set state directly with setState', function () {
			machine.currentState.should.equal('two');
			machine.setState('one').currentState.should.equal('one');
		});
	});

	describe('state machine bindings', function () {
		it('should call all global transition bindings', function () {
			var global = 0;
			var secondGlobal = 0;
			machine.bind(function(oldState, newState) {
				global += 1;
			});
			machine.bind(function(oldState, newState) {
				secondGlobal += 1;
			});
			machine.increment();
			global.should.equal(1);
			secondGlobal.should.equal(1);
			machine.increment();
			global.should.equal(2);
			secondGlobal.should.equal(2);
		});

		it('should call all "from" transition bindings', function () {
			var global = 0;
			var secondGlobal = 0;
			machine.onTransitionFrom('two', function(newState) {
				global += 1;
			});
			machine.onTransitionFrom('two', function(newState) {
				secondGlobal += 1;
			});
			machine.increment();
			global.should.equal(1);
			secondGlobal.should.equal(1);
			machine.increment();
			global.should.equal(1);
			secondGlobal.should.equal(1);
		});

		it('should call all "to" transition bindings', function () {
			var global = 0;
			var secondGlobal = 0;
			machine.onTransitionTo('three', function(newState) {
				global += 1;
			});
			machine.onTransitionTo('three', function(newState) {
				secondGlobal += 1;
			});
			machine.increment();
			global.should.equal(1);
			secondGlobal.should.equal(1);
			machine.increment();
			global.should.equal(1);
			secondGlobal.should.equal(1);
		});

		it('should call all "from-to" transition bindings', function () {
			var global = 0;
			var secondGlobal = 0;
			machine.onTransitionFromTo('two', 'three', function(oldState, newState) {
				global += 1;
			});
			machine.onTransitionFromTo('two', 'three', function(oldState, newState) {
				secondGlobal += 1;
			});
			machine.increment();
			global.should.equal(1);
			secondGlobal.should.equal(1);
			machine.increment();
			global.should.equal(1);
			secondGlobal.should.equal(1);
		});
	});
});
