/* services/AppActivityService.js */
(function () {
  'use strict';

  angular.module('RouteSpeed.theme')
    .factory('AppActivityService', AppActivityService);

  AppActivityService.$inject = ['$rootScope', '$window', '$document', '$timeout', '$log'];

  function AppActivityService($rootScope, $window, $document, $timeout, $log) {
    var doc = $document[0];
    var enabled = false;
    var lastActive = null;
    var resumeArmed = false; // set after deviceready
    var debounceMs = 200;    // smooth out bursts
    var pendingTimer = null;

    // ---- helpers -----------------------------------------------------------

    function hiddenProp() {
      if ('hidden' in doc) return 'hidden';
      if ('msHidden' in doc) return 'msHidden';
      if ('webkitHidden' in doc) return 'webkitHidden';
      return null;
    }

    function isDocumentHidden() {
      var hp = hiddenProp();
      return hp ? !!doc[hp] : false;
    }

    function hasFocus() {
      try { return typeof $window.document.hasFocus === 'function' ? $window.document.hasFocus() : true; }
      catch (e) { return true; }
    }

    // function isOnline() {
    //   // 1) Standard browser signal
    //   var online = ($window.navigator && $window.navigator.onLine !== false);

    //   // 2) Cordova Network Information plugin (optional)
    //   // window.Connection & navigator.connection may exist when plugin installed
    //   try {
    //     if ($window.Connection && $window.navigator && $window.navigator.connection) {
    //       if ($window.navigator.connection.type === $window.Connection.NONE) online = false;
    //     }
    //   } catch (e) { /* ignore */ }

    //   return online;
    // }
    function isOnline() {
      // 1) Prefer Cordova Network Information plugin when available
      try {
        if ($window.Connection && $window.navigator && $window.navigator.connection) {
          // Explicitly offline if type is NONE
          return $window.navigator.connection.type !== $window.Connection.NONE;
        }
      } catch (e) {
        // ignore and fall through to navigator.onLine
      }
    
      // 2) Fallback: use navigator.onLine only when it’s a real boolean
      if ($window.navigator && typeof $window.navigator.onLine === 'boolean') {
        return $window.navigator.onLine;
      }
    
      // 3) No reliable signal → safest is to treat as offline,
      //    or return true here if you prefer optimistic behaviour.
      return false;
    }

    // Consider “active” when: visible, focused, online (or no info saying offline)
    function isActive() {
      return !isDocumentHidden() && hasFocus() && isOnline();
    }

    function emit(name, data) {
      $rootScope.$broadcast(name, data);
      if (name === 'app:active') lastActive = Date.now();
    }

    function debouncedCheck() {
      if (pendingTimer) $timeout.cancel(pendingTimer);
      pendingTimer = $timeout(checkAndEmit, debounceMs);
    }

    function checkAndEmit() {
      pendingTimer = null;
      var active = isActive();
      if (active) {
        emit('app:active', { online: isOnline(), since: lastActive });
      } else {
        emit('app:inactive', { online: isOnline() });
      }
    }

    // ---- listeners (DOM/Cordova) ------------------------------------------

    function addVisibilityListener() {
      var hp = hiddenProp();
      var evt = hp ? hp.replace(/hidden/i, 'visibilitychange') : 'visibilitychange';
      doc.addEventListener(evt, debouncedCheck, false);
      // As a fallback, some browsers fire pageshow when coming from bfcache
      $window.addEventListener('pageshow', debouncedCheck, false);
    }

    function removeVisibilityListener() {
      var hp = hiddenProp();
      var evt = hp ? hp.replace(/hidden/i, 'visibilitychange') : 'visibilitychange';
      doc.removeEventListener(evt, debouncedCheck, false);
      $window.removeEventListener('pageshow', debouncedCheck, false);
    }

    function onFocus() { debouncedCheck(); }
    function onBlur()  { debouncedCheck(); }
    function onOnline(){ emit('app:online'); debouncedCheck(); }
    function onOffline(){ emit('app:offline'); debouncedCheck(); }

    function addWindowListeners() {
      $window.addEventListener('focus', onFocus);
      $window.addEventListener('blur', onBlur);
      $window.addEventListener('online', onOnline);
      $window.addEventListener('offline', onOffline);
    }

    function removeWindowListeners() {
      $window.removeEventListener('focus', onFocus);
      $window.removeEventListener('blur', onBlur);
      $window.removeEventListener('online', onOnline);
      $window.removeEventListener('offline', onOffline);
    }

    // Cordova lifecycle
    function onDeviceReady() {
      resumeArmed = true;
      document.addEventListener('resume', onResume, false);
      document.addEventListener('pause', onPause, false);
      // do an initial evaluation shortly after startup
      $timeout(checkAndEmit, 500);
    }
    function onResume() { debouncedCheck(); }
    function onPause()  { debouncedCheck(); }

    function addCordovaListeners() {
      document.addEventListener('deviceready', onDeviceReady, false);
      // If app already ready (hot-reload scenarios), arm immediately
      if ($window.cordova && $window.cordova.platformId && !resumeArmed) {
        // still wait a tick; some plugins need time
        $timeout(onDeviceReady, 50);
      }
    }
    function removeCordovaListeners() {
      document.removeEventListener('deviceready', onDeviceReady, false);
      document.removeEventListener('resume', onResume, false);
      document.removeEventListener('pause', onPause, false);
    }

    // ---- public API --------------------------------------------------------

    function enable() {
      if (enabled) return;
      enabled = true;
      addVisibilityListener();
      addWindowListeners();
      addCordovaListeners();
      // Kick once now
      $timeout(checkAndEmit, 100);
      $log.debug && $log.debug('[AppActivityService] enabled');
    }

    function disable() {
      if (!enabled) return;
      enabled = false;
      removeVisibilityListener();
      removeWindowListeners();
      removeCordovaListeners();
      if (pendingTimer) { $timeout.cancel(pendingTimer); pendingTimer = null; }
      $log.debug && $log.debug('[AppActivityService] disabled');
    }

    // auto-enable on load
    enable();

    return {
      isActive: isActive,
      isOnline: isOnline,
      enable: enable,
      disable: disable
    };
  }
})();
