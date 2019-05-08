/**
* Helpers
*/

const { keys, values } = Object;

/* Exports */
const getIDBuilder = ({ id, delimiter = "-" }) => //NOTE: A hyphen, not an empty string is the default delimiter, as data-points of different lengths are more common, than those of the same length.
	(item) => id.map((idPart) => item[idPart]).join(delimiter);

const findRelationChain = (name, schema) => {
	const meta = schema[name];

	const chain = [name];
	let parentTable = meta.parent;
	while (parentTable) {
		let parentTableName = parentTable.name;
		chain.push(parentTableName);
		parentTable = schema[parentTableName].parent;
	}

	return chain;
	};

const findRelationChains = (schema) => {
	const chains = {};

	keys(schema).forEach((name) =>
		chains[name] = findRelationChain(name, schema)
	);

	return chains;
};

const removeSubChains = (chains) => {
	values(chains).forEach(chain =>
		chain.slice(1).forEach((tableName) => delete chains[tableName])
	);

	return chains;
};

const buildIndex = (rows, tableSchema) => {
	const buildID = getIDBuilder(tableSchema.meta);
	const index = {};

	rows.forEach((row) => index[buildID(row)] = row);

	return index;
};

module.exports = {
	getIDBuilder,
	findRelationChain,
	findRelationChains,
	removeSubChains,
	buildIndex,
};
