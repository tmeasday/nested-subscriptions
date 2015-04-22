# nested-subscriptions

Allows nesting of subscriptions to easily overlap them.

## Usage

```js
NestedPublish("name", function () {
  this.publish(function() {
    // this is like a "new" subscription that can safely publish
    // the same documents as the outer subscription. 
  });
  this.ready();
});
```

## Goals

You can nest as many times as you like. The properties of a nested sub are:

1. It is a separate "context" so it can publish the same document more than once.
2. An outer subscription won't be ready until all it's child subscriptions are ready.
3. When an outer subscription is stopped, all of it's child subscriptions will stop.