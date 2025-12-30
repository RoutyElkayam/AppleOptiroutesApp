// Reusable module you can import anywhere
(function () {
  'use strict';

  angular.module("RouteSpeed.theme")
  .directive('dragDisableIf', ['$parse', function ($parse) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var expr = $parse(attrs.dragDisableIf);
        var addClass = attrs.dragGuardAddClass || 'dragging-disabled';
        var capture   = attrs.dragGuardCapture !== 'false';         // default true
        var preventKids = attrs.dragGuardPreventChildren !== 'false';// default true
        var raw = element[0];

        // unified cancel
        function cancel(e) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
        }

        // capture-phase guard (stops native & library drags early)
        function captureCancel(e) {
          if (expr(scope)) cancel(e);
        }
        if (capture) raw.addEventListener('dragstart', captureCancel, true);

        function applyDisabled(disabled) {
          // keep attribute + property + ARIA in sync
          raw.draggable = !disabled;
          element.attr('draggable', !disabled);
          element.attr('aria-disabled', !!disabled);

          if (disabled) {
            element.addClass(addClass);
            element.on('dragstart.rsDragGuard', cancel);
          } else {
            element.removeClass(addClass);
            element.off('dragstart.rsDragGuard');
          }
        }

        // watch condition (coerced to boolean)
        scope.$watch(function () { return !!expr(scope); }, applyDisabled);

        // optional: prevent native drag from descendants when disabled
        if (preventKids) {
          var styleTag = document.getElementById('rs-drag-guard-style');
          if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'rs-drag-guard-style';
            styleTag.textContent =
              '[aria-disabled="true"] * { -webkit-user-drag:none; user-drag:none; }';
            document.head.appendChild(styleTag);
          }
        }

        scope.$on('$destroy', function () {
          if (capture) raw.removeEventListener('dragstart', captureCancel, true);
          element.off('.rsDragGuard');
        });
      }
    };
  }]);
})();
