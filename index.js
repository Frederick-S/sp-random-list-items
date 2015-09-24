var RandExp = require('randexp');
var contextHelper = require('sp-context-helper');

function SPRandomListItemsCreation(webUrl, listTitle, useAppContextSite) {
    var contextWrapper = contextHelper(webUrl, useAppContextSite);
    var web = contextWrapper.web;
    this.clientContext = contextWrapper.clientContext;
    this.list = web.get_lists().getByTitle(listTitle);
}

SPRandomListItemsCreation.prototype.create = function (fieldValuesRegularExpression, count, successHandler, errorHandler) {
    for (var i = 0; i < count; i++) {
        var listItemCreateInfo = new SP.ListItemCreationInformation();
        var listItem = this.list.addItem(listItemCreateInfo);

        for (var fieldName in fieldValuesRegularExpression) {
            if (fieldValuesRegularExpression.hasOwnProperty(fieldName)) {
                listItem.set_item(fieldName, new RandExp(fieldValuesRegularExpression[fieldName]).gen());
            }
        }

        listItem.update();
        this.clientContext.load(listItem);
    }

    this.clientContext.executeQueryAsync(successHandler, errorHandler);
};

module.exports = SPRandomListItemsCreation;
