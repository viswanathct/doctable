/**
* Doctable.
*/

// Use AJV with data coercion to validate and impose data on the incoming schema.

const { render, result } = require('./modules/render');

module.exports = {
	render, result,
	hierarchical: require('./modules/hierarchical'),
	relational: require('./modules/relational'),
};
