/**
* The hierarchical doctable.
*/

const { assign, entries, keys } = Object;
const { getIDBuilder, findRelationChains,
	removeSubChains, buildIndex } = require('../helpers');

const hierarchical = (schema, dataset) => {
	const indices = {};
	const denormalized = {};

	const denormalizeTable = (table) => { //TODO: Allow for denormalizing individual chains.
		const chain = findRelationChains(schema)[table];
		const rows = [];
		const ancestors = chain.slice(1);

		ancestors.forEach((ancestor) =>
			indices[ancestor] = buildIndex(dataset[ancestor], schema[ancestor]));

		const parentIDBuilders = (() => {
			const ret = {};
			chain.slice(0, -1).forEach((table) => {
				const parent = schema[table].parent;
				const builderConfig = assign({}, schema[parent.name].meta, parent);
				ret[parent.name] = getIDBuilder(builderConfig);
			});
			return ret;
		})();

		const currentTable = schema[table];
		dataset[table].forEach((row) => {
			const record = { [table]: row };
			let parent = currentTable.parent;
			let currentRow = row;

			while (parent && currentRow) { //NOTE: Recursion couldn't be used, due to performance constraints.
				const parentTableName = parent.name;
				const parentRow = indices[parentTableName][parentIDBuilders[parentTableName](currentRow)];

				if(parentRow)
					record[parentTableName] = parentRow;

				parent = schema[parentTableName].parent;
				currentRow = parentRow;
			}

			rows.push(record);
		});

		return rows;
	};

	const denormalize = () => {
		const chains = removeSubChains(findRelationChains(schema));
		keys(chains).forEach((table) => {
			denormalized[table] = denormalizeTable(table, dataset, schema);
		});
	};

	const cleanse = () => {
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

	const self = {
		indices,
		denormalized,
		cleanse,
		denormalize: (table) => {
			table ? denormalizeTable(table) : denormalize();
			return self;
		},
	};

	return self;
};

module.exports = hierarchical;
