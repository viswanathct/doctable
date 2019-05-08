/**
* Doctable.
*/

// Use AJV with data coercion to validate and impose data on the incoming schema.
// Use functions for dynamic IDs, instead of Array of fields and a delimiter.
// Use partials to reduce the number of passed arguments.
// Operate on individual tables, rather than the whole set.
// Improve the handling of the delimiter.
// Try not to depend on lodash.

module.exports = {
	render: require('./modules/render'),
	hierarchical: require('./modules/hierarchical'),
	relational: require('./modules/relational'),
};
