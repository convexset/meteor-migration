Package.describe({
	name: 'convexset:migration',
	version: '0.1.1',
	summary: 'Simple API for data migration on reload (features \"template-level\" set-up/tear-down)',
	git: 'https://github.com/convexset/meteor-migration',
	documentation: '../../README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.2.1');
	api.use([
		'ecmascript', 'underscore', 'ejson',
		'reload',
		'convexset:package-utils@0.1.9',
	], 'client');
	api.addFiles(['migration.js'], 'client');
	api.export(['onMigrate', 'Migration'], 'client');
});