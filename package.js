Package.describe({
  name: 'nested-subscriptions',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');
  api.use('underscore');
  api.addFiles('nested-subscriptions.js');
  api.export('NestedPublish', 'server');
  api.export('NestedSubscription', 'server');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('test-helpers');
  api.use('mongo');
  api.use('nested-subscriptions');
  api.addFiles('nested-subscriptions-tests.js');
});
