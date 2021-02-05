exports.formCode = {
	initUBComponent: function () {
		const me = this
		me.on("formDataReady", me.onFormDataReady);
	},
	onFormDataReady: function () {
		const me = this
		me.getField('code').setReadOnly(!me.isNewInstance)
	}
};
