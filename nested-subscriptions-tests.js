var Docs = new Mongo.Collection("docs");

if (Meteor.isServer) {
  if (Meteor.isServer) {
    Docs.remove({});
    Docs.insert({name: "value1"});
    Docs.insert({name: "value2"});

    NestedPublish("overlappingPublish", function () {
      this.publish(function() {
        return Docs.find({name: "value1"});
      });
      this.publish(function() {
        return Docs.find({name: "value2"});
      });
      this.publish(function() {
        return Docs.find();
      });
      this.ready();
    });
  }
} else {
  Tinytest.addAsync("nested-subscriptions - publish overlapping cursors in child subscriptions",
    function (test, done) {
      Meteor.subscribe("overlappingPublish", {
        onReady: function() {
          test.equal(Docs.find().count(), 2);
          done();
        },
        onError: function(error) {
          test.fail(error);
          done();
        }
      });
    }
  );
}

if (Meteor.isServer) {
  var innerStopped, outerStopped;
  NestedPublish("stoppedPublish", function() {
    this.publish(function() {
      this.ready();
      innerStopped = false;
      this.onStop(function() {
        innerStopped = true;
      });
    });
    outerStopped = false;
    this.onStop(function() {
      outerStopped = true;
    });
    this.ready();
  });
  
  Meteor.methods({
    innerStopped: function() {
      return innerStopped;
    },
    outerStopped: function() {
      return outerStopped;
    }
  });
} else {
  testAsyncMulti("nested-subscriptions - stopping rules", [
    function (test, expect) {
      this.handle = Meteor.subscribe("stoppedPublish", {
        onReady: expect(function() {}),
      });
    },
    function(test, expect) {
      Meteor.call('innerStopped', expect(function(e, stopped) {
        test.isFalse(stopped);
      }));
    },
    function(test, expect) {
      Meteor.call('outerStopped', expect(function(e, stopped) {
        test.isFalse(stopped);
      }));
    },
    function(test, expect) {
      this.handle.stop();
      // XXX: is there some way to actually wait for the subscription to stop?
      
    },
    function(test, expect) {
      Meteor.call('innerStopped', expect(function(e, stopped) {
        test.isTrue(stopped);
      }));
    },
    function(test, expect) {
      Meteor.call('outerStopped', expect(function(e, stopped) {
        test.isTrue(stopped);
      }));
    }
  ]); 
}

if (Meteor.isServer) {
  var innerHandle, outerHandle;
  NestedPublish("readyPublish", function() {
    outerHandle = this;

    this.publish(function() {
      innerHandle = this;
    });
  });
  
  Meteor.methods({
    makeInnerReady: function() {
      innerHandle.ready();
    },
    makeOuterReady: function() {
      outerHandle.ready();
    }
  });
} else {
  testAsyncMulti("nested-subscriptions - ready rules - inner first", [
    function (test, expect) {
      this.handle = Meteor.subscribe("readyPublish");
      test.isFalse(this.handle.ready());
    },
    function(test, expect) {
      var self = this;
      Meteor.call('makeInnerReady', expect(function() {
        test.isFalse(self.handle.ready());
      }));
    },
    function(test, expect) {
      var self = this;
      Meteor.call('makeOuterReady', expect(function() {
        test.isTrue(self.handle.ready());
      }));
    }
  ]);

  testAsyncMulti("nested-subscriptions - ready rules - outer first", [
    function (test, expect) {
      this.handle = Meteor.subscribe("readyPublish");
      test.isFalse(this.handle.ready());
    },
    function(test, expect) {
      var self = this;
      Meteor.call('makeOuterReady', expect(function() {
        test.isFalse(self.handle.ready());
      }));
    },
    function(test, expect) {
      var self = this;
      Meteor.call('makeInnerReady', expect(function() {
        test.isTrue(self.handle.ready());
      }));
    }
  ]);
}