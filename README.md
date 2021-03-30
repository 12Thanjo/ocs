# OCS

A programming paradigm combining traits of OOP and ECS.

Install via [npm](https://www.npmjs.com):

```bash
npm install ocs
```

## Code Example

This is a showcase of some of the funcitonality of OCS.

```js
// import ocs
var ocs = require('ocs');

// creates an Environment with the name "env"
var env = new ocs.Environment('env');

// creates a Component "position" that has the properties x and y, and adds it to the Environment "env"
var position = new ocs.Component('env', 'position', (x, y)=>{
	return {
		x: x,
		y: y
	}
});

// creates an Entity called "foo", and adds it to the Environment "env"
var foo = new ocs.Entity('env', 'foo');

// adds the "position" Component to foo, and passes 1 to x and 3 to y.
foo.addComponent('position', 1, 3);

// prints: 1
console.log(foo.x);

// removes the "position" Component from foo
foo.removeComponent('position');

// prints: undefined
console.log(foo.x);

// creates a Component "anchor" that has the properties x and y, and adds it to the Environment "env"
var anchor = new ocs.Component('env', 'anchor', (x, y)=>{
	return {
		anchor: new ocs.EEO({
			x: x,
			y: y
		}, (entity, key, val)=>{
			console.log(`The ${key} value of the anchor of ${entity.name} was changed to ${val}`);
		});
	}
});

// adds the "anchor" Component to foo.
foo.addComponent('anchor', 2, 5);

// changes the value of foo.anchor.x to 4
// logs to the console: "The x value of the anchor of foo was changed to 4"
foo.anchor.x = 4;
```

## API

All of the documetation is on the [OCS website](https://12thanjo.github.io/ocs/documentation/ocs.html).

#### Included with the Github Repo:
- index.js: the library that is added with npm
- scrybe.js: index.js with [scrybe](https://www.npmjs.com/package/scrybe) documentation included
- performance.js: index.js with all of the error checking and logging removed
- The full API documentation