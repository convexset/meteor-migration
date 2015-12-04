/* global randomData: true */
/* global Migration: true */
/* global migration_tl: true */

if (Meteor.isClient) {
	Migration.prepareTemplate(Template.MigrationTestTemplateLevel, {
		data: function() {
			return this.templateInstance().randomData;
		},
		reloadCallback: function() {
			var self = this;
			setTimeout(() => self.ready(true), 3000);
			console.log('[' + self.name + '] Allowing reload in 3 sec...');
		},
		historyPayload: function() {
			return {
				numItems: Object.keys(this.templateInstance().randomData).length
			};
		},
	});

	Template.MigrationTestTemplateLevel.onCreated(function() {
		migration_tl = this;
		var instance = this;
		console.log("[Template.MigrationTestTemplateLevel] Created.", Migration.getMigration(instance));
		instance.randomData = randomData();
	});

	Template.MigrationTestTemplateLevel.onDestroyed(function() {
		var instance = this;
		console.log("[Template.MigrationTestTemplateLevel] Destroyed.", Migration.getMigration(instance));
	});

	Template.MigrationTestTemplateLevel.helpers({
		randomData: function() {
			return Template.instance().randomData;
		},
		migrationData: function() {
			return Migration.getMigration(Template.instance()).getMigrationData() || {};
		},
		migrationHistory: function() {
			return Migration.getMigration(Template.instance()).getMigrationHistory() || [];
		}
	});
}