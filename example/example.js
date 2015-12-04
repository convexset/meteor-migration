/* global Reload: true */
/* global randomData: true */

var RANDOM_VERBS = ['running', 'attacking', 'hibernating', 'sleeping', 'vomiting', 'coding', 'sneaking', 'lecturing', 'lazing'];
var RANDOM_NOUN = ['dog', 'cat', 'pizza', 'pigeon', 'seal', 'starfish', 'panda', 'racoon', 'banana', 'jellyfish', 'avocado'];

randomData = function randomData() {
	var n_items = 1 + Math.round(Math.random() * 5);
	return _.object(_.range(n_items).map(
		n => [
			'item_' + (n + 1),
			RANDOM_VERBS[Math.floor(RANDOM_VERBS.length * Math.random())] + '-' + RANDOM_NOUN[Math.floor(RANDOM_NOUN.length * Math.random())]
		]));
};


if (Meteor.isClient) {
	Template.MigrationTest.onCreated(function() {
		var instance = this;
		instance.haveTemplateLevelMigration = new ReactiveVar(true);
	});

	Template.MigrationTest.helpers({
		haveTemplateLevelMigration: () => Template.instance().haveTemplateLevelMigration.get()
	});

	Template.MigrationTest.events({
		'click button.reload': function() {
			console.log("Reloading...");
			Reload._reload();
		},
		'click button.toggle-template-level-migration': function(event, template) {
			var haveTemplateLevelMigration;
			Tracker.nonreactive(function() {
				haveTemplateLevelMigration = template.haveTemplateLevelMigration.get();
			});
			if (!haveTemplateLevelMigration) {
				template.$('.toggle-template-level-migration').text("Remove Template-Level Migration Item");
			} else {
				template.$('.toggle-template-level-migration').text("Include Template-Level Migration Item");
			}
			template.haveTemplateLevelMigration.set(!haveTemplateLevelMigration);
		}
	});
}