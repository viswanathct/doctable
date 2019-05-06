/**
* Doctable.
*/

// Improve the handling of the delimiter.

const { entries, keys, values } = Object;
const { result } = require("lodash");

/* Helpers */
const getIDBuilder = ({ id, delimiter = "-" }) => //NOTE: A hyphen, not an emoty string is the default delimiter, as data-points of different lengths are more common, than those of the same length.
	(item) => id.map((idPart) => item[idPart]).join(delimiter);

const findRelationChains = (tables) => {
	const chains = {};

	entries(tables).forEach(([name, meta]) => {
		const relChain = [name];
		let parentTable = meta.parent;
		while (parentTable) {
			let parentTableName = parentTable.name;
			relChain.push(parentTableName);
			parentTable = tables[parentTableName].parent;
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
				ret[parent.name] = getIDBuilder(parent);
				const id = parent.id || schema[parent.name].self.id;
				ret[parent.name] = getIDBuilder({ id, delimiter: "-" });
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
		entries(template).forEach(([key, value]) =>
			document[key] = (rendererForType[typeof value] || defaultRenderer)(data, value));

		return document;
	};

	const rendererForType = {
		object: cast,
		function: (data, value) => value(data),
	};
	const defaultRenderer = (data, value) => result(data, value, null) || null;

	return cast;
})();

module.exports = {
	buildIndex,
	denormalize,
	cleanse,
	cast,
};
