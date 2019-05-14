/**
 * The cheatsheet.
 */
const { schema, data } = require("./stub");

/* Targets */
const { doctable: relational } = require("../src").relational;

/* Helpers */
const { log, runExamples } = require('./helpers');

/* Data */


/* Examples */
const examples = {

	"Simple use case": () => {

		const table = relational(schema, data);
		table.denormalize('person');
		log(JSON.stringify(table.denormalized))
	},
};

/* Main */
runExamples(examples, 0);

module.exports = {
	examples,
}
