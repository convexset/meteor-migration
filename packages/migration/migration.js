/* global Reload: true */
/* global Migration: true */
/* global onMigrate: true */
/* global __meteor_runtime_config__: true */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';
checkNpmVersions({
	'package-utils': '^0.2.1',
	'underscore': '^1.8.3',
});
const PackageUtilities = require('package-utils');
const _ = require('underscore');

var MIGRATION_NAME = "convexset:migration";

Migration = function(name) {
	this.init.call(this, name);
};
onMigrate = function(name) {
	return new Migration(name);
};

// Where migration data will be stored
var allMigrations = {};
PackageUtilities.addMutablePropertyObject(Migration, 'allMigrations', allMigrations);
PackageUtilities.addImmutablePropertyFunction(Migration, 'prepareTemplate', function prepareTemplate(template, options) {
	template.onCreated(function() {
		var instance = this;

		var name = instance && instance.data && instance.data.migrationName || template.viewName;
		instance[MIGRATION_NAME] = onMigrate(name);

		options = _.extend({
			data: {},
			reloadCallback: () => instance[MIGRATION_NAME].ready(true),
			historyPayload: {},
		}, options);

		instance[MIGRATION_NAME]
			.templateInstance(instance)
			.data(options.data)
			.reloadCallback(options.reloadCallback)
			.historyPayload(options.historyPayload);
	});

	template.onDestroyed(function() {
		var instance = this;
		instance[MIGRATION_NAME].stop();
	});
});
PackageUtilities.addImmutablePropertyFunction(Migration, 'getMigration', function getMigration(tmplInstance) {
	return tmplInstance[MIGRATION_NAME];
});

// Grab migration data if available
var _migrationPayload = EJSON.parse(Reload._migrationData(MIGRATION_NAME) || "{}");

// Set up onMigrate onStartup
var _retryFn = null;
var _migrationDataGenerationComplete = false;
var _dataPayload;
Meteor.startup(function() {
	Reload._onMigrate(MIGRATION_NAME, function(retry) {
		var isReady = true;
		_.forEach(allMigrations, function(migration) {
			isReady = isReady && Tracker.nonreactive(_.bind(migration.ready, migration));
		});

		if (isReady) {
			_retryFn = null;

			// Prepare data payload and history
			if (!_migrationDataGenerationComplete) {
				var now = new Date();
				_dataPayload = {};
				_.forEach(allMigrations, function(migration, key) {
					var history = (_migrationPayload && _migrationPayload[key] && _migrationPayload[key].history || []).map(x => x);
					history.unshift(_.extend({
						migrationTime: now,
						initTime: migration._initTime,
					}, migration.historyPayload()));

					_dataPayload[key] = {
						migrationTime: now,
						initTime: migration._initTime,
						history: history,
						data: Tracker.nonreactive(_.bind(migration.data, migration)),
					};
				});
				_migrationDataGenerationComplete = true;
			}

			// Stop all computations
			_.forEach(allMigrations, migration => migration.stop());
			return [true, EJSON.stringify(_dataPayload)];
		} else {
			if (!_retryFn) {
				_retryFn = retry;
				_.forEach(allMigrations, function(migration) {
					migration.reloadCallback();
				});
			}
			return false;
		}
	});
});


Migration.prototype = {
	init: function(name) {
		var self = this;

		self.name = name || Meteor.uuid();

		if (!!allMigrations[self.name]) {
			throw new Meteor.Error('migration-already-exists', self.name);
		} else {
			allMigrations[self.name] = self;
		}

		self._ready = false;
		self._stopped = false;
		self._getCount = 0;
		self._retryFn = null;
		self._initTime = new Date();
		self._reloadCallback = (() => self.ready(true));

		// Set default history payload
		self._historyPayload = function() {
			return __meteor_runtime_config__ || {};
		};

	},

	stop: function() {
		if (this._stopped) {
			throw new Meteor.Error('already-stopped', 'Migration instance already stopped.');
		}

		if (!!this._computation) {
			this._computation.stop();
		}
		delete allMigrations[this.name];
		this._stopped = true;
	},

	ready: function(boolOrFunction) {
		if (this._stopped) {
			throw new Meteor.Error('already-stopped', 'Migration instance already stopped.');
		}

		var self = this;
		if (boolOrFunction) {
			self._ready = boolOrFunction;
			self._resetComputation();
			return self;
		} else {
			return _.isFunction(self._ready) ? Tracker.nonreactive(_.bind(self._ready, self)) : !!self._ready;
		}
	},

	data: function(valueOrFunction) {
		if (this._stopped) {
			throw new Meteor.Error('already-stopped', 'Migration instance already stopped.');
		}
		
		var self = this;
		if (typeof valueOrFunction !== "undefined") {
			self._data = valueOrFunction;
			return self;
		} else {
			return _.isFunction(self._data) ? Tracker.nonreactive(_.bind(self._data, self)) : self._data;
		}
	},

	getMigrationData: function() {
		this._getCount += 1;
		return _migrationPayload && _migrationPayload[this.name] && _migrationPayload[this.name].data;
	},

	numGetMigrationDataCalls: function() {
		return this._getCount;
	},

	getMigrationHistory: function() {
		return _migrationPayload && _migrationPayload[this.name] && _migrationPayload[this.name].history;
	},

	reloadCallback: function(reloadCallback) {
		if (this._stopped) {
			throw new Meteor.Error('already-stopped', 'Migration instance already stopped.');
		}
		
		var self = this;
		if (reloadCallback) {
			self._reloadCallback = _.isFunction(reloadCallback) ? reloadCallback : (() => self.ready(true));
			return self;
		} else {
			return _.isFunction(self._reloadCallback) ? Tracker.nonreactive(_.bind(self._reloadCallback, self)) : null;
		}
	},

	historyPayload: function(dataOrFunction) {
		if (this._stopped) {
			throw new Meteor.Error('already-stopped', 'Migration instance already stopped.');
		}
		
		var self = this;
		if (dataOrFunction) {
			self._historyPayload = dataOrFunction;
			return self;
		} else {
			return _.isFunction(self._historyPayload) ? Tracker.nonreactive(_.bind(self._historyPayload, self)) : self._historyPayload;
		}
	},

	templateInstance: function(templateInstance) {
		if (this._stopped) {
			throw new Meteor.Error('already-stopped', 'Migration instance already stopped.');
		}
		
		var self = this;
		if (templateInstance) {
			self._templateInstance = templateInstance;
			return self;
		} else {
			return self._templateInstance;
		}
	},

	// Call retry function on ready change
	_resetComputation: function() {
		if (this._stopped) {
			throw new Meteor.Error('already-stopped', 'Migration instance already stopped.');
		}
		
		var self = this;
		if (!!self._computation) {
			self._computation.stop();
		}

		// Reload tracker
		self._computation = Tracker.autorun(function() {
			var isReady = self.ready();
			if (isReady && _retryFn) {
				_retryFn();
			}
		});
	}
};