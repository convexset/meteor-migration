# migration

`migration` is a Meteor package that supports migration of EJSON-serializable data (on reloads triggered by hot code push) via a simplified interface to `Reload._onMigrate`. The package supports "template-level setups" that are torn down after template instances are destroyed.

Acknowledgements go out to Chris Mather of [Evented Mind](https://www.eventedmind.com/) for [useful example code](https://github.com/cmather/meteor-migration).


## Install

This is available as [`convexset:migration`](https://atmospherejs.com/convexset/migration) on [Atmosphere](https://atmospherejs.com/). (Install with `meteor add convexset:migration`.)


## Table of Contents

Somehow `doctoc` links in Atmosphere get messed up. Navigate this properly in [GitHub](https://github.com/convexset/meteor-migration/).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [The Example](#the-example)
- [Usage: Direct](#usage-direct)
- [Usage: "Template-level"](#usage-template-level)
- [Reference: `Migration` instance methods](#reference-migration-instance-methods)
- [Reference: `Migration` methods](#reference-migration-methods)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## The Example

An example app using the tool directly and in a "template-level" fashion is provided.

## Usage: Direct

Direct Usage is simple:

```javascript
// give each migration a name
onMigrate('hello-1')
    // indicate a callback when a reload is called
    // the default callback immediately updates the status of the migration to
    // ready (i.e.: () => self.ready(true))
    .reloadCallback(function() {
        var self = this;

        // set the data to be migrated
        self.data(instance.randomData1);  // Choose data as object

        // indicate that this "migration" is ready
        // the reload will proceed once all migrations are marked as ready
        setTimeout(() => self.ready(true), 3000);
        console.log('[' + self.name + '] Allowing reload in 3 sec...');
    })
    // indicate the payload recorded in "migration history" obtainable via
    // migration1.getMigrationHistory()
    .historyPayload({  // Choose payload as item
        numItems: Object.keys(instance.randomData1).length
    });
    // on reload, migration data is available via migration1.getMigrationData()
    // ... and the number of retrievals might be checked via
    //     migration1.numGetMigrationDataCalls()

// alternative use
onMigrate('hello-2')
    .data(() => instance.randomData2)  // Choose data source as function
    .historyPayload(function() {       // Choose payload as function
        return {
            numItems: Object.keys(instance.randomData2).length
        };
    });
```

To obtain migration data:

```javascript
// Suppose the return value of onMigrate('xxx') was placed in the migration
// key of the template instance...
Template.MigrationTestDirect.helpers({
	migrationData: function() {
		return Template.instance().migration.getMigrationData() || {};
	},
	migrationHistory: function() {
		return Template.instance().migration.getMigrationHistory() || [];
	},
}
```

## Usage: "Template-level"

All you need to know are featured in the below examples.

To start doing things at a "template-level", make use of `Migration.prepareTemplate` and set the relevant options:
 - `data`: data, typically a function that can refer to the template instance using `this.templateInstance()` internally
 - `reloadCallback` should set `this.ready(true)` once the reload can proceed
 - `historyPayload` is used for storing additional information in the "migration history" section

Noting that `migration.templateInstance()` can be used to obtain the relevant template instance, one might wonder if, given a template instance, one could do the reverse. The answer is to use:
 - `Migration.getMigration(instance)`: returns the `Migration` instance attached to a template instance.

```javascript
Migration.prepareTemplate(Template.MigrationTestTemplateLevel, {
	data: function() {
		// This points to the Migration instance
		// xxx.templateInstance() returns the relevant template instance, if
		// applicable
		return this.templateInstance().randomData;
	},
	reloadCallback: function() {
		var self = this;
		setTimeout(() => self.ready(true), 3000);
		console.log('[' + self.name + '] Allowing reload in 3 sec...');
	},
	historyPayload: function() {
		// This points to the Migration instance
		// xxx.templateInstance() returns the relevant template instance, if
		// applicable
		return {
			numItems: Object.keys(this.templateInstance().randomData).length
		};
	},
});
```

```html
{{> MigrationTestTemplateLevel}}
<!-- Throws an error if a custom name is not set for the next instance -->
{{> MigrationTestTemplateLevel migrationName='MigrationTestTemplateLevel.2'}}
```

Here's how migration data might be obtained:

```javascript
Template.MigrationTestTemplateLevel.helpers({
	migrationData: function() {
		return Migration.getMigration(Template.instance()).getMigrationData() || {};
	},
	migrationHistory: function() {
		return Migration.getMigration(Template.instance()).getMigrationHistory() || [];
	}
});
```

## Reference: `Migration` instance methods 

 - `ready()`: returns whether this `Migration` instance is ready for reload
 - `data()`: returns the data to be migrated in a upcoming reload
 - `historyPayload()`: returns the history information to be recorded in the upcoming reload
 - `reloadCallback()`: calls the reload call back that is fires when a reload is triggered (the package will run this)

 - `ready(readyStatus)`: sets the ready-for-migration status of this `Migration` instance is ready for reload to `readyStatus` (also accepts a function that will be called to evaluate the `readyStatus`)
 - `data(dataOrFunction)`: sets the data to be migrated to `dataOrFunction` (also accepts a function that will be called to obtain that content)
 - `historyPayload(dataOrFunction)`: sets the information to be migrated in migration history to `dataOrFunction` (also accepts a function that will be called to obtain that content)
 - `reloadCallback(callback)`: sets the reload callback to `callback`

 - `getMigrationData()`: returns the data migrated from the previous hot code reload
 - `numGetMigrationDataCalls()`: returns the number of times `getMigrationData` was called (typically used to prevent double-dipping)
 - `getMigrationHistory()`: returns the history of past migrations

 - `stop()`: "stop" this `Migration` instance, so it will not be used on the next reload triggered by a hot code push

 - `templateInstance(templateInstance)`: ("internal method") associates template instance `templateInstance` to the `Migration` instance
 - `templateInstance()`: ("internal method") returns any associated template instance


## Reference: `Migration` methods 

 - `Migration.allMigrations`: list all migrations that will be 
 - `Migration.prepareTemplate`: See: [Usage: "Template-level"](#usage-template-level)
 - `Migration.getMigration(templateInstance)`: Returns the `Migration` object for a template instance `templateInstance` (See: [Usage: "Template-level"](#usage-template-level))