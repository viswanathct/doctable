/**
 * The cheatsheet.
 */
const { schema, data } = require("./stub");

/* Targets */
const { relational } = require("../src");

/* Helpers */
const { runExamples } = require('./helpers');

/* Data */


/* Examples */
const examples = {

	"Simple use case": () => {

		const table = relational(schema, data);
		table.denormalize('person');
		console.log(JSON.stringify(table.denormalized))
	},
};

/* Main */
runExamples(examples, 0);

module.exports = {
	examples,
}
