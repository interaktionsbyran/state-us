# Stateus - the simple state machine library

To install Stateus just type `npm install stateus` and then use just like any other npm module:

```javascript
var Stateus       = require('Stateus');
var stateMachine = new Stateus(states, startState, context);
```

The states object looks like this:

```javascript
{
  min: {
    toggle: function() {
      // do something (but return a string with
      // the name of the new state)
      // you can use the context specified on initialization
      // as the local context (using the this keyword)
    },
    turnOff: 'off'
  },
  max: {
    toggle: function() {},
    turnOff: 'off'
  },
  off: {
    turnOn: 'min'
  }
}
```

You specify the state names as keys of the object. Then in those keys you add another object specifying transitions.
The transition names would be used as functions on the state machine. So for example `stateMachine.turnOff()`.
If the given state does not support a given transition but it's valid for some other state no error would be executed and
nothing apart from a log message printed would be happening.
The transition themselves can be either strings or closures. If it's a string it just points to the name of the resulting
state from that transition. If it's a closure inside the closure you can do additional logic before returning a string with
the resulting state. Inside that closure you can use `this` which will actually be the context you specified on initialization time (the last argument in the init). The default starting state is a string specifying the initial state of the state machine.

You can also bind callbacks on state changes.
To bind a callback on any state change use the bind method like this:
```javascript
stateMachine.bind(function(oldState, newState){
  [...]
});
```

This would be executed on any state change. If you wanna bind for specific state changes you have two options:
- bind when transitioning from any to a specific state
- bind when transitioning from a specific state to any state
- bind from a specific to a specific state

All those types of bindings can have many callbacks attached, not just one and all of them would be executed by the order they were bound by. And you can use arrays to specify multiple states in both from and to to make combinations for all cases. Here is a good list of examples:

```javascript
stateMachine.onTransitionTo('newStateName', function(oldState){
  [...]
});

stateMachine.onTransitionFrom('oldStateName', function(newState){
  [...]
});

stateMachine.onTransitionTo(['newStateName', 'anotherNewStateName'], function(oldState){
  [...]
});

stateMachine.onTransitionFrom(['oldStateName', 'anotherOldStateName'], function(newState){
  [...]
});

stateMachine.onTransitionFromTo('oldStateName', 'newStateName', function(oldState, newState){
  [...]
});

stateMachine.onTransitionFromTo(['oldStateName', 'another'], 'newStateName', function(oldState, newState){
  [...]
});

stateMachine.onTransitionFromTo('oldStateName', ['newStateName', 'another'], function(oldState, newState){
  [...]
});

stateMachine.onTransitionFromTo(['oldStateName', 'another'], ['newStateName', 'anotherNew'], function(oldState, newState){
  [...]
});
```

The order of the bindings' execution depends on the order of your definitions. The different types of bindings are executed in the following order:

 1. all global bindings (using `bind`)
 2. all from specific to specific (using `onTransitionFromTo`)
 3. from specific to any (using `onTransitionFrom`)
 4. from any to a specific (using `onTransitionTo`)

And again as in other cases of the state machine, in the bindings the `this` keyword is still pointing to the desired context when initializing the state machine.
