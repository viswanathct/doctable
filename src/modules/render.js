/**
* Rendering - IE: Data Templating.
*/

const { entries } = Object;
const { result } = require("lodash");

/* Exports */
const render = (document, template) => { //Note: The template is the second param, as it makes edits easier.
	//TODO: Enhancement: Compile and cache the render for each view.
	const view = {};
	entries(template).forEach(([key, value]) => {
		const ret = (rendererForType[typeof value] || result)(document, value);
		if(ret !== undefined) view[key] = ret;
	});

	return view;
};

/* Helpers */
const rendererForType = {
	object: render,
	function: (data, value) => value(data),
};

module.exports = render;
