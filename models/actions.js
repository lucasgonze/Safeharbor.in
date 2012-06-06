var ACTION_STATES =  {
    received_email: 1,
    received_web_form: 2,
    received_snail_mail: 3,
    triage_required: 4,
    takedown_request: 5,
    not_a_dmca: 6,
    take_down_media: 7,
    ignore_bogus_request: 8,
    repost_media: 9,
    return_for_correction: 10,
    waiting_for_response: 11,
    file_counter_claim: 12,
    requester_files_suit: 13,
    decision_pending: 14,
    request_time_out: 15,
    decision_won: 16,
    decision_lost: 17,
    flag_requester: 18,
    flag_uploader: 19
    };


var metas = [];
metas[ACTION_STATES.received_email] = 
    { cap: 'Received email takedown request. Triage required',
      priority: 100,
      flowsTo: [
        ACTION_STATES.triage_required
      ]};
metas[ACTION_STATES.received_web_form]   = 
    { cap: 'Received web form takedown request. Triage required',
      priority: 100,
      flowsTo: [
        ACTION_STATES.triage_required
      ] };
metas[ACTION_STATES.received_snail_mail] = 
    { cap: 'Received postal mail takedown request. Triage required',
      priority: 100,
      flowsTo: [
        ACTION_STATES.triage_required
      ]  };
metas[ACTION_STATES.triage_required]     = 
    { cap: 'Received takedown request. Triage required',
      priority: 100,
      flowsTo: [
        ACTION_STATES.takedown_request,
        ACTION_STATES.ignore_bogus_request
       ] };
metas[ACTION_STATES.takedown_request]    = 
    { cap: 'Takedown request verified. Response required',
      priority: 100,
      flowsTo: [
        ACTION_STATES.not_a_dmca,
        ACTION_STATES.take_down_media,
        ACTION_STATES.return_for_correction 
       ] };
metas[ACTION_STATES.not_a_dmca]    = 
    { cap: 'This is not a DMCA. No more action required.',
      priority: 100,
      flowsTo: [
        ACTION_STATES.repost_media 
       ] };
metas[ACTION_STATES.take_down_media]    = 
    { cap: 'Media has been removed. Response required',
      priority: 100,
      flowsTo: [
        ACTION_STATES.not_a_dmca,
        ACTION_STATES.file_counter_claim 
       ] };
metas[ACTION_STATES.ignore_bogus_request]    = 
    { cap: 'The request is being ignored.',
      priority: 100,
      flowsTo: [
       ] };
metas[ACTION_STATES.repost_media]    = 
    { cap: 'Media has been re-posted.',
      priority: 100,
      flowsTo: [
       ] };
metas[ACTION_STATES.return_for_correction]    = 
    { cap: 'Request has been returned for correction.',
      priority: 100,
      flowsTo: [
        ACTION_STATES.waiting_for_response 
       ] };
metas[ACTION_STATES.waiting_for_response]    = 
    { cap: 'Waiting for response.',
      priority: 100,
      flowsTo: [
            ACTION_STATES.received_email,
            ACTION_STATES.received_snail_mail,
            ACTION_STATES.received_web_form,
            ACTION_STATES.request_time_out,
            ACTION_STATES.requester_files_suit
       ] };
metas[ACTION_STATES.file_counter_claim]    = 
    { cap: 'Counter claim is being filed.',
      priority: 100,
      flowsTo: [
        ACTION_STATES.waiting_for_response 
       ] };
metas[ACTION_STATES.requester_files_suit]    = 
    { cap: 'Requester has filed suit.',
      priority: 100,
      flowsTo: [
        ACTION_STATES.decision_pending 
       ] };
metas[ACTION_STATES.decision_pending]    = 
    { cap: 'Decision pending in counter claim.',
      priority: 100,
      flowsTo: [
        ACTION_STATES.decision_lost,
        ACTION_STATES.decision_won 
       ] };
metas[ACTION_STATES.request_time_out]    = 
    { cap: 'Request has timed out.',
      priority: 100,
      flowsTo: [
        ACTION_STATES.repost_media 
       ] };
metas[ACTION_STATES.decision_won]    = 
    { cap: 'Favorable outcome in counter-claim',
      priority: 100,
      flowsTo: [
        ACTION_STATES.repost_media,
       ] };
metas[ACTION_STATES.decision_lost]    = 
    { cap: 'Unfavorable outcome in counter-claim',
      priority: 100,
      flowsTo: [
       ] };
       
// I'm pretty sure the flagging system is different than 'action flow'
// For the flagging system you'll need a list of canned reasons
// why the person is being flagged/banned and whole other audit trail
// of communications with them....

metas[ACTION_STATES.flag_requester]    = 
    { cap: 'Flag the requester.',
      priority: 100,
      flowsTo: [
        ACTION_STATES.not_a_dmca,
        ACTION_STATES.file_counter_claim 
       ] };
metas[ACTION_STATES.flag_uploader]    = 
    { cap: 'Flag the uploader.',
      priority: 100,
      flowsTo: [
        ACTION_STATES.not_a_dmca,
        ACTION_STATES.file_counter_claim 
       ] };


exports.ACTIONS = metas;
exports.ACTION_STATES = ACTION_STATES;