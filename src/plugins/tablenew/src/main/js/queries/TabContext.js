define(
  'tinymce.plugins.tablenew.queries.TabContext',

  [
    'ephox.katamari.api.Option',
    'ephox.snooker.api.CellNavigation',
    'ephox.snooker.api.TableLookup',
    'ephox.sugar.api.dom.Compare',
    'ephox.sugar.api.node.Element',
    'ephox.sugar.api.node.Node',
    'ephox.sugar.api.search.SelectorFilter',
    'ephox.sugar.api.search.SelectorFind',
    'ephox.sugar.api.selection.CursorPosition',
    'tinymce.core.util.VK',
    'tinymce.plugins.tablenew.queries.TableTargets'
  ],

  function (Option, CellNavigation, TableLookup, Compare, Element, Node, SelectorFilter, SelectorFind, CursorPosition, VK, TableTargets) {
    var forward = function (editor, isRoot, cell, lazyWire) {
      return go(editor, isRoot, CellNavigation.next(cell), lazyWire);
    };

    var backward = function (editor, isRoot, cell, lazyWire) {
      return go(editor, isRoot, CellNavigation.prev(cell), lazyWire);
    };

    var go = function (editor, isRoot, cell, actions, lazyWire) {
      return cell.fold(Option.none, Option.none, function (current, next) {
        return CursorPosition.first(next).bind(function (cursor) {
          var rng = editor.dom.createRng();
          rng.setStart(cursor.dom(), 0);
          rng.setEnd(cursor.dom(), 0);
          return Option.some(rng);
        });
      }, function (current) {
        return TableLookup.table(current, isRoot).bind(function (table) {
          var targets = TableTargets.noMenu(current);
          actions.insertRowsAfter(table, targets);
          var allRows = SelectorFilter.descendants(table, 'tr');
          if (allRows.length > 0) {
            var last = allRows[allRows.length - 1];
            return SelectorFind.descendant(last, 'td,th').map(function (first) {
              var rng = editor.dom.createRng();
              rng.setStart(first.dom(), 0);
              rng.setEnd(first.dom(), 0);
              return rng;
            });
          }
        });
      });
    };

    var handle = function (event, editor, actions, lazyWire) {
      if (event.keyCode === VK.TAB) {
        var body = Element.fromDom(editor.getBody());
        var isRoot = function (element) {
          return Compare.eq(element, body) || Node.name(element) === 'table';
        };

        var rng = editor.selection.getRng();
        if (rng.collapsed) {
          var start = Element.fromDom(rng.startContainer);
          TableLookup.cell(start, isRoot).each(function (cell) {
            event.preventDefault();
            var navigation = event.shiftKey ? backward : forward;
            var rng = navigation(editor, isRoot, cell, actions, lazyWire);
            rng.each(function (range) {
              editor.selection.setRng(range);
            });
          });
        }
      }
    };

    return {
      handle: handle
    };
  }
);
