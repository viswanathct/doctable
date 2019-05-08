module.exports = {

	schema: {
		person: {
			meta: {
				id: ['id'] // This could be a string, array of strings with an optional delimiter or a function.
			},
			fields: {
				id: 'string',
				friend: {
					type: 'rel',
					table: 'person',
					id: ['friend'],
					delimiter: '-',
				},
				car: {
					type: 'rel',
					table: 'car',
				},
			},
		},
		car: {
			fields: {
				id: 'string',
			},
		},
	},
	data: {
		person: [
			{
				id: 'a',
				friend: 'b',
				car: '1',
			},
			{
				id: 'b',
			},
		],
		car: [
			{
				id: '1',
				name: 'bandwagon',
			}
		]
	},
};
