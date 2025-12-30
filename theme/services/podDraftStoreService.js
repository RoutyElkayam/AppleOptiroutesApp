// use the SAME module name as your existing services:
angular.module('RouteSpeed.theme')
.factory('PodDraftStore', function($window,$rootScope,$http,$q,StopService) {
  const KEY = (stopId) => `podDraft:${stopId}`;

  function load(stopId) {
    try { return JSON.parse($window.localStorage.getItem(KEY(stopId)) || '{}'); }
    catch(_) { return {}; }
  }

  function save(stopId, draft) {
    $window.localStorage.setItem(KEY(stopId), JSON.stringify(draft || {}));
  }

  function clear(stopId) {
        const ls = $window.localStorage;
        const PREFIX = 'podDraft:';
        if (stopId != null) {
        const candidates = [
          `${PREFIX}${stopId}`,
          `${PREFIX}${String(stopId).trim()}`,
          `${PREFIX}${Number(stopId)}`,
        ];
        candidates.forEach(k => ls.removeItem(k));
    } else {
        Object.keys(ls).forEach(k => { if (k.startsWith(PREFIX)) ls.removeItem(k); });
    }
  }

  var isRunning = false;
  // Pull tokens directly when needed so callers don't have to pass them around
  function authHeaders() {
    return {
      'x-csrf-token-app': localStorage.getItem('identify_number'),
      'user-token-app': localStorage.getItem('user_id'),
    };
  }

  function base() {
    // Same helper used in your app
    return $rootScope.getBaseUrl();
  }

  function dataURItoBlob(dataURI) {
    var byteString = dataURI.split(',')[0].indexOf('base64') >= 0
      ? atob(dataURI.split(',')[1])
      : unescape(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ia], { type: mimeString });
  }

  function buildFileDataFromDraft(draft) {
    var fd = new FormData();

    // images
    var imgs = draft.images || [];
    for (var i = 0; i < imgs.length; i++) {
      fd.append('img' + i.toString(), dataURItoBlob(imgs[i]), 'img' + i.toString() + '.jpeg');
    }

    // signature (optional)
    if (draft.signatureDataUrl) {
      fd.append('file', dataURItoBlob(draft.signatureDataUrl), 'signature.png');
    }

    // simple fields (mirror your current append logic)
    fd.append('sign_file', draft.sign_file || '');
    fd.append('remarks', draft.remarks || '');
    fd.append('returns', draft.returns || '');
    fd.append('receiver_name', draft.receiver_name || '');
    fd.append('receiver_phone_number', draft.receiver_phone_number || '');
    fd.append('collected_pallets', draft.current_stop.small_pallets || 0);
    if (draft.current_stop.big_pallets)        fd.append('delivered_pallets', draft.current_stop.big_pallets);
    if (draft.current_stop.collected_plastons) fd.append('collected_plastons', draft.current_stop.collected_plastons);
    if (draft.current_stop.delivered_plastons) fd.append('delivered_plastons', draft.current_stop.delivered_plastons);

    fd.append('lat', draft.lat != null ? draft.lat : null);
    fd.append('lng', draft.lng != null ? draft.lng : null);
    if (draft.formattedAddress) fd.append('formattedAddress', draft.formattedAddress);

    return { fd, imagesCount: imgs.length };
  }

  function getPendingDrafts() {
    // Assumes PodDraftStore exposes something like: getAll() or list()
    // and the draft shape includes: current_stop (with id & status), remarks, returns,
    // attachedImages, signature, sign_file, receiverName, receiverPhoneNumber, pallets/plastons, etc.
    var drafts = [];

    angular.forEach($rootScope.crnt_route || [], function (stop) {
      if(stop.status == 0 || stop.status == 4 || stop.draft_status) {
        var d = load(stop.id);     // sync read
        if (d && Object.keys(d).length) drafts.push(d);
      }
    });

    return drafts.filter(function (d) {
      return d && d.current_stop 
        && !d._syncing;
    });
  }

  function processOne(draft) {

      // mark draft "in-sync" to avoid re-pickup in parallel runs
      draft._syncing = true; save(draft.current_stop.id, draft);

      var stop = draft.current_stop;
      
      let signReq = null;
      if($rootScope.current_user.pod_option && draft.status){
        // 1) send signature + images
        const { fd, imagesCount } = buildFileDataFromDraft(draft);

        var url = base() + 'order/set_signature&id=' + stop.id + '&images=' + draft.images.length;

        signReq = $http.post(url, fd, {
          headers: angular.extend({ 'Content-Type': undefined }, authHeaders()),
          transformRequest: angular.identity

        });
        stop.pod = 1;
        draft.current_stop.pod = 1; // mark as POD done
      }
      
      // 2) finish station (status true = success; use your saved flag)
      var nextStop = $rootScope.crnt_route.filter(function(stop) {
        return stop.stop_index = draft.current_stop.stop_index + 1;
      })[0];

      const markReq = StopService.markComplete(
        stop,
        draft.status,
        nextStop,
        draft.remarks,
      );

      // 3) create documentation
        // Always true due to (status || !status); keep as-is if intentional.
      const isEndDoc = draft.documentation && draft.documentation.start_hour &&
        ($rootScope.current_user.arrival_reporting_app || draft.status || !draft.status);
      
      // 4) delete existing unsigned documentation to prevent double docs (only for startDoc, not endDoc)
      const deleteDocReq = !isEndDoc
        ? () => $http.post(base() + 'documentation/delete_unsigned_doc&stopid=' + stop.id, {}, {
            headers: authHeaders()
          })
        : () => $q.resolve();

      const docReq = isEndDoc
        ? () => StopService.endDocumentation(stop, draft.documentation, draft.remarks, draft.returns, true)
        : () => StopService.startDocumentation(stop, true, draft.remarks, draft.returns, true);

          // Chain everything and only then clear the draft
          if($rootScope.current_user.pod_option && draft.status){
            return $q.all([signReq, markReq])
              .then(() => deleteDocReq())
              .then(() => docReq())
              .finally(() => { draft._syncing = false; save(stop.id, draft);clear(stop.id) })
              .catch(err => {
                draft._syncing = false; save(stop.id, draft);
                return $q.reject(err);
            });
          }else{
            return $q.all([markReq])
              .then(() => deleteDocReq())
              .then(() => docReq())
              .finally(() => { draft._syncing = false; save(stop.id, draft);clear(stop.id) })
              .catch(err => {
                draft._syncing = false; save(stop.id, draft);
                return $q.reject(err);
            });
          }
          
    }

  function syncDrafts() {
    if (isRunning) return $q.resolve(false);
    isRunning = true;

    var drafts = getPendingDrafts().filter(d => !d._syncing);    // skip drafts already in progress;
    if (!drafts.length) {
      isRunning = false;
      return $q.resolve(false);
    }
    var results = [];
    // serial chain
    var chain = $q.when();
    drafts.forEach(function (d) {
      chain = chain.then(function () { return processOne(d)
        .then(function () { results.push({ id: d.current_stop.id, ok: true }); })
        .catch(function (err) {
          // swallow per-draft errors so others continue
          console.error('Draft sync failed for draft', d, err);
        });
      });
    });

    
    return chain
      .then(function () { return results; })
      .finally(function () { isRunning = false; });
  }

  return { load, save, clear, syncDrafts , getPendingDrafts  };
});