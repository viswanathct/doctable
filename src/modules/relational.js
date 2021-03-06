/**
* The relational doctable.
*/

const { assign, keys, values } = Object;
const { isArray } = Array;
const { collect } = require("@laufire/utils").collection;
const { getIDBuilder, findRelationChains, buildIndex } = require("../helpers");

/* Helpers */
const standardizeSchema = (() => {
	const standardizeMeta = (meta) => {
		if(typeof meta !== 'object') {
			return { id: ['id']};
		}
		else {
			if(!isArray(meta.id))
				meta.id = [meta.id || 'id']
		}

		return meta;
	};

	const fieldSchemaProcessors = {
		undefined: (fieldSchema, field) => assign({ source: field }, fieldSchema),
		rel: (fieldSchema, field) => {
			if(isArray(fieldSchema.id)) {
				fieldSchema.idBuilder = getIDBuilder(fieldSchema);
			}
			else {
				const id = fieldSchema.id || field;
				fieldSchema.id = [id];
				fieldSchema.idBuilder = (record) => record[id];
			};

			return fieldSchema;
		}
	};

	const standardizeFieldSchema = (fieldSchema, field) =>
			typeof fieldSchema != 'object'
			? { type: fieldSchema, source: field }
			: (fieldSchemaProcessors[fieldSchema.type]
				|| fieldSchemaProcessors[undefined])(fieldSchema, field);

	return (schema) => {
			values(schema).forEach((table) => {
			table.meta = standardizeMeta(table.meta);
			table.fields = collect(table.fields, standardizeFieldSchema);
		});
	};
})();

/* Exports */
const doctable = (schema, dataset) => {
	standardizeSchema(schema);

	const chains = findRelationChains(schema);
	const tablesWithRelations = keys(chains);
	const denormalized = {};
	const indices = collect(chains, (table) => buildIndex(dataset[table], schema[table]));
	const recordParsers = {
		rel: (record, fieldSchema) =>
			indices[fieldSchema.table][fieldSchema.idBuilder(record)],
	}

	const parseRecord = (record, schema) => //TODO: Enhancement; Compile the record parsers.
		collect(schema.fields, (fieldSchema) => {
			const source = fieldSchema.source
			const value = record[source];

			if(value !== undefined || !source) {
				const recordParser = recordParsers[fieldSchema.type];
				return recordParser ? recordParser(record, fieldSchema) : value
			}
		});

	const denormalizeTable = (table) => {
		const cached = denormalized[table];

		if(cached)
			return cached;

		records = denormalized[table] = [];
		currentTableData = dataset[table];
		tableSchema = schema[table];

		const l = currentTableData.length;
		let i = 0;

		while(i < l)
			records.push(parseRecord(currentTableData[i++], tableSchema));

		return records;
	};

	const self = {
		indices,
		denormalized,
		denormalize: (table) => {
			table ? denormalizeTable(table) : tablesWithRelations.forEach(denormalizeTable);
			return self;
		},
	};

	return self;
};

module.exports = {
	doctable,
	findRelationChains,
};
