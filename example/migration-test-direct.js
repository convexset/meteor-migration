/* global onMigrate: true */
/* global randomData: true */
/* global migration1: true */
/* global migration2: true */

if (Meteor.isClient) {
	Template.MigrationTestDirect.onCreated(function() {
		var instance = this;

		instance.randomData1 = randomData();
		instance.randomData2 = randomData();

		migration1 = onMigrate('direct-1')
			.reloadCallback(function() {
				var self = this;
				self.data(instance.randomData1);  // Choose data as object
				setTimeout(() => self.ready(true), 3000);
				console.log('[' + self.name + '] Allowing reload in 3 sec...');
			})
			.historyPayload({  // Choose payload as item
				numItems: Object.keys(instance.randomData1).length
			});

		migration2 = onMigrate('direct-2')
			.data(() => instance.randomData2)  // Choose data source as function
			.historyPayload(function() {       // Choose payload as function
				return {
					numItems: Object.keys(instance.randomData2).length
				};
			});

		instance.migration1 = migration1;
		instance.migration2 = migration2;
	});

	Template.MigrationTestDirect.helpers({
		randomData1: function() {
			return Template.instance().randomData1;
		},
		migrationData1: function() {
			return Template.instance().migration1.getMigrationData() || {};
		},
		migrationHistory1: function() {
			return Template.instance().migration1.getMigrationHistory() || [];
		},

		randomData2: function() {
			return Template.instance().randomData2;
		},
		migrationData2: function() {
			return Template.instance().migration2.getMigrationData() || {};
		},
		migrationHistory2: function() {
			return Template.instance().migration2.getMigrationHistory() || [];
		}
	});
}