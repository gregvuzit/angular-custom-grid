/*
  customGrid directive builds a grid for a list of items. Each item corresponds to a row of the grid. 
  The rows and each column within the row is configured via an object passed in to the directive as the 
  'config' parameter. Directive allows optional searching and sorting of the column fields, as well as 
  specifying the maximum number of items to show, the format for any dates in grid content, and any parent 
  scope functions to be called for operations on the data of a grid item.

  All configuration can be done in the config object without need for markup.

  Directive was developed for a project where angular-ui-grid was not meeting the requirements for grids.
  At the time, the grids created using angular-ui-grid were not working well when the number of grid items
  would change dynamically and the grid had to be resized. Thus, the need for something similar. A lot of
  the ideas in this directive were taken from how angular-ui-grid seems to do things. This was meant more
  as an exercise to see if something like this could be accomplished more than anything else, so there are
  likely many improvements that could be made.

  Due to how the ngRepeat directive works (goes through a compile before its linking), this meant that
  using a template with a ngRepeat element on it, and then dynamically building child elements based on the
  configuation and attaching them to the ngRepeat node, seemingly did not work. By the time the apGrid's link
  function fires, the ngRepeat's compile will have already run, and it will not dynamically accept content
  for linking. So all content is built dynamically in this directive.

  When each individual grid item is built, it is given a temporary scope value of 'item', allowing all
  binding on it to work. Makes various use of $compile, $interpolate, and $scope.eval() for binding
  angular expressions within the conent. 

  A possible efficiency improvement might be to create a directive that wraps
  an individual grid item, again building content dynamically. This might allow editing/adding/removing just
  this list item, instead of currently rebuilding all the grid content other than the headers in these
  situations.

  @param {attribute} list - Required. Represents the list of items to be depicted in the grid
  @param {attribute} config - Required. Javascript object representing configuration of grid and its fields.
    See example of how this object should be formatted below.
  @param {attribute} headerRowClass - Optional. CSS classes for the header row div
  @param {attribute} contentRowClass - Optional. CSS classes for each content row div
  @param {attribute} sorting - Optional. If true, sorting is enabled on specified grid columns. Default: false
  @param {attribute} search - Optional. If true, search is enabled on grid. Default: false
  @param {attribute} maxItems - Optional. Specifies max number of grid items to render. Default: infinity
  @param {attribute} dateFormat - Optional. Specifies date format for any date data in grid. Default: 'M/d/yyyy, h:mm:ss a'
  @param {attribute} addFunction - Optional. The parent scope function that handles adding a grid item.
  @param {attribute} editFunction - Optional. The parent scope function that handles editing a grid item.
  @param {attribute} deleteFunction - Optional. The parent scope function that handles deleting a grid item.
  @param {attribute} customFunction - Optional. A parent scope function that will handle any sort of custom
    functionality involving a grid item's data.

   <custom-grid
      list="users"
      config="gridConfig"
      header-row-class="row header-row"
      content-row-class="row global-content-row"
      sorting="true"
      search="true"
      add-function="addUser" 
      edit-function="editUser"
      custom-function="resetPassword"
      max-items="100"
      date-format="yyyy-MM-dd hh:mm:ss a">
  </custom-grid>

  Config object description:
    * title - Optional. Text that will show up in the 'Add New' link if the grid has an addFunction param.
    * providedScope - Optional. Javascript object that can contain any additional objects or functions 
        from parent scope that need to be provided to the directive. Use this for values that need to be
        provided for a column contentExpression or for custom sorting or colClass functions (see all below).
    * columnDefs - Required. List that specifies configuration for each grid column. All properties are
        optional other than colLength, though it will not work unless either property or customContent are
        defined.

  columnDef description:
    * colLength - The number of bootstrap col-xs columns that grid should encompass.
    * name - Display name for column that will appear in its header
    * property - Can be either string or function. If column is to be sorted, this must be defined.
        If a string, represents the raw value of the property of the grid item object to be shown 
        in the column. If a function, represents a custom sorting function. Must be proceeded by a
        getProvidedScope() call and the function must be defined in the providedScope of the config.
        If a function, a customExpression value must also be provided.
    * headerClass - CSS classes for the header div of the column
    * date - If provided, any date values within column value will be formatted using the directive
        dateFormat value.
    * colClass - CSS classes for each column content div. Can be either string or function. If a function,
        should return a text string of the classes. Must be proceeded by a getProvidedScope() call 
        and the function must be defined in the providedScope of the config.
    * contentExpression - Use this if you need the column value to be something other than its raw value
        and run it through an angular expression. Takes any string that represents a valid angular expression.
        Use 'item' to denote the grid item in the expression. Do not use this if any html markup is needeed.
        Use customContent instead.
    * customContent - Use this if custom html content needs to be placed in the column. Takes any valid
        string representing any combination of markup and angular expressions (denoted by handlebars
        if necessary). As with contentExpression, use 'item' to denote the grid item. Connect with the
        functions specified in the directive parameters here, ie, edit-function, delete-function, and/or
        custom-function (add-function is built automatically). Specify them in the markup as 'edit', for
        edit-function, 'delete' for delete-function, and 'custom' for custom-function. Pass $event as a
        param in the call. Ex: <a ng-click="edit($event)">Edit</a>


  For an example, using the apGrid example above, this would be the setup of the config object in its
  parent scope controller:

  var customColumn = '<button type="button" ng-click="custom($event)" class="btn btn-default">Reset Password</button>' +
                     '<button type="button" ng-click="edit($event)" class="btn btn-default pull-right">Edit</button>';
  var nameColumnExpression = 'item.firstName + \' \' + item.lastName';
  var typeColumnExpression = 'getProvidedScope().user_types[item.accountTypeId]';

  $scope.gridConfig = {
    title: 'User',
    columnDefs: [
      { name: 'Id', property: 'id', colLength: 2, 
        colClass: 'rowItem global-content-column', headerClass: 'column-header' },
      { name: 'Username', property: 'userName', colLength: 1,
        colClass: 'rowItem global-content-column', headerClass: 'column-header' },
      { name: 'Name', property: 'lastName', colLength: 2, contentExpression: nameColumnExpression,
        colClass: 'rowItem global-content-column', headerClass: 'column-header' },
      { name: 'Created At', property: 'creationTimestamp', colLength: 2, date: true,
          colClass: 'rowItem global-content-column', headerClass: 'column-header' },
      { name: 'Type', property: 'getProvidedScope().sortOnAccountType', colLength: 2, contentExpression: typeColumnExpression,
        colClass: 'rowItem global-content-column', headerClass: 'column-header' },
      { name: 'Email', property: 'emailAddress', colLength: 2,
        colClass: 'getProvidedScope().getColumnClass(item.readableType())', headerClass: 'column-header' },
      { colLength: 2, colClass: 'rowItem', customContent: customColumn }
    ],
    providedScope: {
      user_types: USER_TYPE_STRINGS,
      // Getter function for sorting on user account type
      sortOnAccountType: function(item) {
        return USER_TYPE_STRINGS[item.accountTypeId];
      },
      // Provides class value for columns
        getColumnClass: function(category) {
          var result = 'val';
          if (category === 'alarm') {
            result += ' alarm';
          }
          if (category === 'troubled') {
            result += ' troubled';
          }
          return result;
        }
      }
  };
 */

'use strict';

angular.module('angular-custom-grid')
  .directive('customGrid', function ($compile, $filter, $interpolate) {

    var propertiesToWatch = [];
    var dateFormat, deregisterWatchers, sorting, search, identityColumn, contentRowClass, headerRowClass;

    /******************************** PRIVATE FUNCTIONS ***************************************/

    // Build individual grid column header element
    var buildHeader = function(columnDef, scope) {
      var result = '<div class="col-xs-' + columnDef.colLength;
      if (angular.isDefined(columnDef.headerClass)) {
        result += ' ' + columnDef.headerClass;
      }

      var sortValue;
      if (sorting && (angular.isDefined(columnDef.property))) {
        // Set up sorting only if directive sorting property is true and the column will not
        // consist of sortable content.

        // Value could be function or string
        sortValue = _.isFunction(scope.$eval(columnDef.property)) ? columnDef.property : '\'' + columnDef.property + '\'';
        result += ' sort-cursor" ng-click="setSorting(' + sortValue + ')';
      }
      result += '">';

      if (angular.isDefined(columnDef.name)) {
        result += columnDef.name;
      }

      if (sorting && (angular.isDefined(columnDef.property))) {
        result += '<div class="not-sorted" ng-if="!setSortingClass(' + sortValue + ')">';
        result += '<div class="sort sort-descending-false"></div>';
        result += '<div class="sort sort-descending-true"></div>';
        result += '</div>';
        result += '<div ng-class="setSortingClass(' + sortValue + ')"></div>';
      }

      result += '</div>';
      return result;
    };

    // Build row of grid headers
    var buildHeaderRow = function(el, scope, headerRowClass) {
      // Build headers
      var headerRow = $('<div/>', {
        class: headerRowClass
      });

      angular.forEach(scope.config.columnDefs, function(columnDef) {
        // Push all the object properties shown in the grid to propertiesToWatch.
        // These will be used for the watchers to determine if content needs to be updated.
        if (angular.isDefined(columnDef.property)) {
          propertiesToWatch.push(columnDef.property);
        }

        var columnHeaderDivText = buildHeader(columnDef, scope);
        headerRow.append(columnHeaderDivText);
      });

      compileToScope(headerRow, el, scope);
    };

    // Build individual content row column content
    var buildContentItem = function(item, columnDef, scope) {
      var result = '<div class="col-xs-' + columnDef.colLength;
      if (angular.isDefined(columnDef.colClass)) {
        // Value could be function or string, so run it through $eval if former
        var classVal = (columnDef.colClass.indexOf('getProvidedScope') !== -1) ? 
                          scope.$eval(columnDef.colClass) : columnDef.colClass;
        result += ' ' + classVal;
      }
      result += '">';

      if (angular.isDefined(columnDef.customContent)) {
        // If custom html content, run the raw string passed in through $interpolate to bind
        // any angular expressions
        var interpolateFunc = $interpolate(columnDef.customContent);
        result += interpolateFunc(scope);
      }
      else {
        var columnVal;
        if (angular.isDefined(columnDef.contentExpression)) {
          columnVal = scope.$eval(columnDef.contentExpression);
        }
        else {
          // Column is defined by the 'property' value in config.
          // If column value represents a function, run it.
          columnVal = _.isFunction(item[columnDef.property]) ? item[columnDef.property]() 
                                                             : item[columnDef.property];

          if (angular.isUndefined(columnVal)) {
            columnVal = '';
          }
        }

        if (columnDef.date) {
          // Format any date column
          columnVal = $filter('date')(columnVal, dateFormat);
        }
        result += columnVal;
      }

      return result;
    };

    // Build all grid content rows
    var buildContentRows = function(el, scope, contentRowClass) {
      angular.forEach(scope.internalList, function(item) {
        var contentRow = $('<div/>', {
          class: 'grid-row ' + contentRowClass
        });

        // Place the object corresponding to the row in the root DIV of the row's
        // data. This will be used on any events fired within the row to get the
        // corresponding object.
        contentRow.data(item);

        // Put grid item in scope so $eval works for this
        scope.item = item;
        angular.forEach(scope.config.columnDefs, function(columnDef) {
          var columnDivText = buildContentItem(item, columnDef, scope);
          contentRow.append(columnDivText);
        });

        compileToScope(contentRow, el, scope);
        scope.item = {};
      });
    };

    // Build search box and/or add link
    var buildGridTopContent = function(scope, addFunction) {
      var rowClass = search ? 'row search-box' : 'row';
      var result = $('<div/>', {
        class: rowClass
      });

      var rowContent = '';
      if (search) {
        rowContent += '<span><label>Search:</label>';
        rowContent += '<input type="text" ng-change="runFilters()" ng-model="filter.search" focus></span>';
      }

      if (angular.isDefined(addFunction)) {
        rowContent += '<a ng-click="add()" class="pull-right">Add New ' + scope.config.title + '</a>';
      }

      result.append(rowContent);
      return result;
    };

    // Build all grid content
    var buildGrid = function(el, scope, contentRowClass, headerRowClass, addFunction) {
      if (search || angular.isDefined(addFunction)) {
        // Add searchbox and/or Add New link
        var row = buildGridTopContent(scope, addFunction);
        compileToScope(row, el, scope);
      }

      buildHeaderRow(el, scope, headerRowClass, sorting);
      buildContentRows(el, scope, contentRowClass);
    };

    // Compile all angular elements in built markup to the scope.
    var compileToScope = function(content, el, scope) {
      var template = $compile(content)(scope);
      el.append(template);
    };

    // Rebuild grid
    var refreshGridData = function(el, scope, contentRowClass) {
      $('.grid-row', el).remove();
      buildContentRows(el, scope, contentRowClass);
    };

    /******************************** LINK ***************************************/

    function link(scope, element, attrs) {

      /************* GRID ITEM DATA MANIPULATION FUNCTIONS ******************/
      /*
        These provide ways to call functions in the directive's parent scope for
        common data manipulation on a grid item: add, edit, and delete. There is also
        a handler for a custom function that will do something with the item. All of them
        get the root div of the grid item's row, and use its 'data' prop to retrieve the object.
        They then call the parent scope function that corresponds to the action (defined by
        directive attributes).
      */
      scope.add = function() {
        scope.addFunction()();
      };

      scope.custom = function($event) {
        var rowDiv = $($event.target).parents('.grid-row', element);
        scope.customFunction()(rowDiv.data());
      };

      scope.edit = function($event) {
        var rowDiv = $($event.target).parents('.grid-row', element);
        scope.editFunction()(rowDiv.data());
      };

      scope.delete = function($event) {
        var rowDiv = $($event.target).parents('.grid-row', element);
        scope.deleteFunction()(rowDiv.data());
      };

      /***************** SCOPE FUNCTIONS ******************/

      // Returns the 'providedScope' portion of the 'config' object passed into the directive.
      // This object can contain any additional needed variables or functions from parent scope
      // that will be useful to directive.
      scope.getProvidedScope = function() {
        return scope.config.providedScope;
      };

      // Run grid content through filters if necessary and then rebuild grid. This will essentially reset 
      // the content. You always want to run through the orderBy and search filters to preserve the grid 
      // in the state it was in before the reset.
      scope.runFilters = function() {
        if (angular.isDefined(attrs.maxItems)) {
          scope.internalList = $filter('limitTo')(scope.list, attrs.maxItems);
        }

        if (search) {
          scope.internalList = $filter('filter')(scope.list, scope.filter.search, undefined);
        }

        if (sorting && (angular.isDefined(scope.sort.column))) {
          scope.internalList = $filter('orderBy')(scope.internalList, scope.sort.column, scope.sort.descending);
        }

        refreshGridData(element, scope, contentRowClass);
      };

      /**
       * Set the new state of the 'sort' object and run the list through the orderBy filter using it
       * @param newSortColumn {String} or {Function} - If a string, the name of the column that is being
       *   set to sort on. If a function, the function that should be called to get the value to sort on
       *   for a column.
       */
      scope.setSorting = function(newSortColumn) {
        if (scope.sort.column === newSortColumn) {
          // Already sorting this column. Just change sort order.
          scope.sort.descending = !scope.sort.descending;
        } else {
          scope.sort.column = newSortColumn;
          scope.sort.descending = false;
        }
        scope.runFilters();
      };

      /**
       * If newSortColumn matches currentSortColumn, set the caret class for it, else show nothing.
       * @param newSortColumn {String} - column that is being set to sort on
       * returns {string} - class
       */
      scope.setSortingClass = function(newSortColumn) {
        return newSortColumn === scope.sort.column && 'sort sort-descending-' + scope.sort.descending;
      };

      /******************************** CONTENT WATCHER CODE ***************************************/

      // This builds the watchers on any of the properties whose data is shown in the grid. In other
      // words they will trigger if any content relevant to the grid is changed.
      var getListWatchProperties = function(obj, keys) {
        return Object.keys(obj).filter(function (key) {
          return keys.indexOf(key) !== -1;
        }).reduce(function (result, key) {
          result[key] = obj[key];
          return result;
        }, {});
      };

      // Pass the propertiesToWatch array built in buildHeaderRow to getListWatchProperties to
      // set up watchers on content for individual grid item.
      var buildListWatchers = function(item) {
         return getListWatchProperties(item, propertiesToWatch);
      };

      // Watch set up function. Runs through all grid items using map and builds watchers for 
      // their grid content through buildListWatchers
      var watchScopeList = function() {
        return scope.list.map(buildListWatchers);
      };

      // Run on any change to the external list
      scope.$watchCollection('list', function() {
        if (angular.isDefined(deregisterWatchers)) {
          // If this isn't the first time the watchers have been set up, deregister them and set
          // them up again. This needs to happen because if a grid item is edited, and then a later action
          // changes the external list (add/delete), the original watcher on the grid item is "lost"
          // and will not work anymore. This will "refresh" all the watchers.
          deregisterWatchers();
        }

        // Watch grid content on individual items
        deregisterWatchers = scope.$watch(watchScopeList, function(newVals, oldVals) {
          // For each item in the current internal list, compare its old and new value.
          // If there has been a change, change all the item properties to the new values
          // returned by the watcher.
          angular.forEach(scope.internalList, function(item) {
            var itemInNewVals = _.find(newVals, function(newVal) {
              return newVal[identityColumn] === item[identityColumn];
            });

            var itemInOldVals = _.find(oldVals, function(oldVal) {
              return oldVal[identityColumn] === item[identityColumn];
            });

            if (!angular.equals(itemInOldVals, itemInNewVals)) {
              for (var prop in itemInNewVals) {
                item[prop] = itemInNewVals[prop];
              }
            }
          });

          if (search || sorting) {
            // Run the internal list through a filter on the external list that essentially matches
            // anything. This is a way to "reconnect" the internal list with the external one and 
            // pick up any added/deleted items before resetting the content. Somewhat of a hack so there 
            // may be a better way to do this.
            scope.internalList = $filter('filter')(scope.list, '', undefined);
          }

          // Reset content
          scope.runFilters();
        }, true);
      });

      /******************************** INITIALIZATION ***************************************/

      scope.filter = {};
      sorting = false;
      search = false;
      contentRowClass = (angular.isDefined(attrs.contentRowClass)) ? attrs.contentRowClass : '';
      headerRowClass = (angular.isDefined(attrs.headerRowClass)) ? attrs.headerRowClass : '';
      identityColumn = (angular.isDefined(attrs.identityColumn)) ? attrs.identityColumn : 'id';
      dateFormat = (angular.isDefined(attrs.dateFormat)) ? attrs.dateFormat : 'M/d/yyyy, h:mm:ss a';
      if (attrs.sorting === 'true') {
        // Set up sorting if needed
        sorting = true;
        scope.sort = {};
        if (angular.isDefined(attrs.initialSortValue)) {
          scope.sort.column = attrs.initialSortValue;
          scope.sort.descending = (angular.isDefined(attrs.initialSortDescending)) ? attrs.initialSortDescending : false;
        }
      }
      if (attrs.search === 'true') { search = true; }

      if (search || sorting) {
        // Deep copy the list data and use this as the actual scope value to manipulate. This keeps the list
        // value in the parent scope unaffected by any filter changes here in the directive. The results of
        // the filter calls will all be applied to the deep copy. The search filter will use the original 
        // parent scope value as the base for its queries.
        scope.internalList = angular.copy(scope.list);
      }
      else {
        // If there's no sorting or searching, no need for a deep copy. The internal and external lists
        // will always be the same.
        scope.internalList = scope.list;
      }
      buildGrid(element, scope, contentRowClass, headerRowClass, attrs.addFunction);
    }

    return {
      restrict: 'E',
      scope: {
        list: '=',
        config: '=',
        deleteFunction: '&',
        addFunction: '&',
        editFunction: '&',
        customFunction: '&'
      },
      link: link
    };
  });