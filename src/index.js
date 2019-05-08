/**
* Doctable.
*/

// Improve the handling of the delimiter.
// Use AJV with data coercion to validate and impose data on the incoming schema.
// Use functions for dynamic IDs, instead of Array of fields and a delimiter.

const { assign, entries, keys, values } = Object;
const { result } = require("lodash");

/* Helpers */
const getIDBuilder = ({ id, delimiter = "-" }) => //NOTE: A hyphen, not an emoty string is the default delimiter, as data-points of different lengths are more common, than those of the same length.
	(item) => id.map((idPart) => item[idPart]).join(delimiter);

const findRelationChains = (schema) => {
	const chains = {};

	entries(schema).forEach(([name, meta]) => {
		const relChain = [name];
		let parentTable = meta.parent;
		while (parentTable) {
			let parentTableName = parentTable.name;
			relChain.push(parentTableName);
			parentTable = schema[parentTableName].parent;
		}
		chains[name] = relChain;
	});

	return chains;
};

const removeSubChains = (chains) => {
	values(chains).forEach(chain =>
		chain.slice(1).forEach((tableName) => delete chains[tableName])
	);

	return chains;
};

/* Exports */
const buildIndex = (rows, tableSchema) => {
	const buildID = getIDBuilder(tableSchema.self);
	const index = {};

	rows.forEach((row) => index[buildID(row)] = row);

	return index;
};

const denormalize = (tables, schema) => { //TODO: Allow for denormalizing individual chains.
	const denormalized = {};

	const chains = removeSubChains(findRelationChains(schema));
	entries(chains).forEach(([tableName, chain]) => {
		const table = denormalized[tableName] = [];
		const ancestors = chain.slice(1);
		const ancestorIndices = {};
		ancestors.forEach((ancestor) =>
			ancestorIndices[ancestor] = buildIndex(tables[ancestor], schema[ancestor]));

		const parentIDBuilders = (() => {
			const ret = {};
			chain.slice(0, -1).forEach((tableName) => {
				const parent = schema[tableName].parent;
				const builderConfig = assign({}, schema[parent.name].self, parent);
				ret[parent.name] = getIDBuilder(builderConfig);
			});
			return ret;
		})();

		const currentTable = schema[tableName];
		tables[tableName].forEach((row) => {
			const record = { [tableName]: row };
			let parent = currentTable.parent;
			let currentRow = row;

			while (parent && currentRow) { //NOTE: Recursion couldn't be used, due to performance constraints.
				const parentTableName = parent.name;
				const parentRow = ancestorIndices[parentTableName][parentIDBuilders[parentTableName](currentRow)];

				record[parentTableName] = parentRow;
				parent = schema[parentTableName].parent;
				currentRow = parentRow;
			}

			table.push(record);
		});
	});

	return denormalized;
};

const cleanse = (denormalized, schema) => {
	const chains = removeSubChains(findRelationChains(schema));
	const cleansed = {};

	entries(chains).forEach(([tableName, chain]) => {
		const chainLength = chain.length;
		const table = denormalized[tableName];
		cleansed[tableName] = table.filter((document) =>
			keys(document).length == chainLength);
	});

	return cleansed;
};

const cast = (() => { //NOTE: The wrapper function is merely for namespacing.
	const cast = (data, template) => { //Note: The template is the second param, as it makes edits easier.
		//TODO: Enhancement: Compile and cache the render for each view.
		const document = {};
		entries(template).forEach(([key, value]) => {
			const ret = (rendererForType[typeof value] || result)(data, value);
			if(ret !== undefined) document[key] = ret;
		});

		return document;
	};

	const rendererForType = {
		object: cast,
		function: (data, value) => value(data),
	};

	return cast;
})();

module.exports = {
	buildIndex,
	denormalize,
	cleanse,
	cast,
};
