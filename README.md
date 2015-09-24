# sp-random-list-items
Create SharePoint list items with random field values that match given regular expressions.

## Installation
```
npm install sp-random-list-items --save
```

## Usage
```js
var SPRandomListItemsCreation = require('sp-random-list-items');

// Initialize an instance with web url and list title
// Use new SPRandomListItemsCreation('web url', 'list title', true) if the you need SP.AppContextSite to get the web
var randomListItemsCreation = new SPRandomListItemsCreation('web url', 'list title');

// randomListItemsCreation.create(fieldValuesRegularExpression, count, done, error)
// Create 20 list items with given field values regular expression
randomListItemsCreation.create({
    'Title': /great|good|bad|excellent/,
    'Score': /\d{3}/
}, 20, function (sender, args) {
    // Do something
}, function (sender, args) {
    // Error
});
```

## License
MIT.
