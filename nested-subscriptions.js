NestedPublish = function(name, handler) {
  Meteor.publish(name, function() {
    var nestedSub = new NestedSubscription(this);
    nestedSub.publish.apply(nestedSub, [handler].concat(arguments));
  });
};

var Subscription;
var setSubscriptionPrototype = function(subscription) {
  if (! Subscription) {
    Subscription = subscription;
    _.extend(NestedSubscriptionNode.prototype, Subscription.prototype, nestedSubMethods);
  }
}

NestedSubscription = function(subscription, notRoot) {
  setSubscriptionPrototype(subscription.constructor);
  
  this.subscription = subscription;
  this.session = subscription._session;
  this.root = null;
}

_.extend(NestedSubscription.prototype, {
  publish: function(handler, params) {
    if (this.root) {
      throw "A Nested Subscription can only publish once. Call this.publish inside its handler to publish again";
    }
    
    this.root = new NestedSubscriptionNode(this, this.session, handler, params);
    return this.root._runHandler();
  },
  _checkTreeReady: function() {
    if (this.root._ready) {
      this.subscription.ready();
    }
  },
  // pass onStop right through to the subscription
  onStop: function(fn) {
    this.subscription.onStop(fn);
  }
});

// Does the work. A subclass of Subscription
var NestedSubscriptionNode = function(_parent, session, handler, params) {
  var self = this;
  
  // XXX: should we generate a name like flips.0.1?, likewise a _subscriptionId?
  //   for the moment all names are undefined, this will appear a universal sub
  Subscription.call(self, session, handler, null, params);
  
  self._children = [];
  
  // is this particular subscription ready?
  self._nodeReady = false;
  // is the entire tree of this and it's children ready?
  self._ready = false;

  self._parent = _parent;
  self._parent.onStop(function() {
    self.stop();
  });
}


var nestedSubMethods = {
  publish: function(handler) {
    var child = new NestedSubscriptionNode(this, this._session, handler);
    this._children.push(child);
    return child._runHandler();
  },

  _checkTreeReady: function() {
    var allChildrenReady = _.all(this._children, function(child) {
      return child._ready;
    });
    this._ready = (allChildrenReady && this._nodeReady);
    if (this._ready) { 
      this._parent._checkTreeReady();
    }
  },
  
  ready: function() {
    this._nodeReady = true;
    this._checkTreeReady();
  },
  
  // We overwrite this because livedata's rule only 'truly' stops 
  //   named subscriptions.
  stop: function() {
    if (! this._isDeactivated()) {
      this._removeAllDocuments();
      this._deactivate();
    }
  }
};
