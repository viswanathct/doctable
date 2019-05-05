/**
* Doctable.
*/

const { entries, keys, values } = Object;
const { result } = require("lodash");

/* Helpers */
const getIDBuilder = ({ id, delimiter = "-" }) =>
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
const denormalize = (schema, data) => {
	const denormalized = {};

	const chains = removeSubChains(findRelationChains(schema));
	entries(chains).forEach(([tableName, chain]) => {
		const table = denormalized[tableName] = [];

		const ancestors = chain.slice(1);
		const ancestorIndices = {};
		ancestors.forEach((ancestor) => {
			const ancestorTable = schema[ancestor];
			const buildID = getIDBuilder({ id: ancestorTable.self.id, delimiter: "-" });
			const ancestorIndex = ancestorIndices[ancestor] = {};
			data[ancestor].forEach((row) => ancestorIndex[buildID(row)] = row);
		});
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
		data[tableName].forEach((row) => {
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

const cleanse = (schema, denormalized) => {
	const chains = removeSubChains(findRelationChains(schema));
	const cleansed = {};

	entries(chains).forEach(([tableName, chain]) => {
		const chainLength = chain.length;
		const data = denormalized[tableName];
		cleansed[tableName] = data.filter((record) =>
			keys(record).length == chainLength);
	});

	return cleansed;
};

const renderView = (() => { //NOTE: The wrapper function is merely for namespacing.
	const renderView = (view, data) => { //TODO: Enhancement: Compile and cache the render for each view.
		const document = {};
		entries(view).forEach(([key, value]) =>
			document[key] = (rendererForType[typeof value] || defaultRenderer)(value, data));

		return document;
	};

	const rendererForType = {
		object: renderView,
		function: (value, data) => value(data),
	};
	const defaultRenderer = (value, data) => result(data, value, null) || null;

	return renderView;
})();

module.exports = {
	denormalize,
	cleanse,
	renderView,
};
