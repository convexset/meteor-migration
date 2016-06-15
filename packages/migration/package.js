Package.describe({
	name: 'convexset:migration',
	version: '0.1.1_3',
	summary: 'Simple API for data migration on reload (features \"template-level\" set-up/tear-down)',
	git: 'https://github.com/convexset/meteor-migration',
	documentation: '../../README.md'
});

Package.onUse(function(api) {
	api.versionsFrom('1.3.1');
	api.use([
		'ecmascript', 'ejson',
		'reload',
		'tmeasday:check-npm-versions@0.3.1'
	], 'client');
	api.addFiles(['migration.js'], 'client');
	api.export(['onMigrate', 'Migration'], 'client');
});