var ACTION_STATES = exports.ACTION_STATES = {
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

exports.ACTION_FLOWS = [
    [ ACTION_STATES.received_email,      ACTION_STATES.triage_required ],
    [ ACTION_STATES.received_web_form,   ACTION_STATES.triage_required ],
    [ ACTION_STATES.received_snail_mail, ACTION_STATES.triage_required ],
    
    [ ACTION_STATES.triage_required,     ACTION_STATES.takedown_request ],
    [ ACTION_STATES.triage_required,     ACTION_STATES.ignore_bogus_request ],
    
    [ ACTION_STATES.takedown_request,    ACTION_STATES.not_a_dmca ],
    [ ACTION_STATES.takedown_request,    ACTION_STATES.take_down_media ],
    [ ACTION_STATES.takedown_request,    ACTION_STATES.return_for_correction ],

    [ ACTION_STATES.take_down_media,     ACTION_STATES.not_a_dmca ],
    [ ACTION_STATES.take_down_media,     ACTION_STATES.file_counter_claim ],

    [ ACTION_STATES.return_for_correction,    ACTION_STATES.waiting_for_response ],

    [ ACTION_STATES.file_counter_claim,       ACTION_STATES.waiting_for_response ],

    [ ACTION_STATES.waiting_for_response,       ACTION_STATES.received_email ],
    [ ACTION_STATES.waiting_for_response,       ACTION_STATES.received_snail_mail ],
    [ ACTION_STATES.waiting_for_response,       ACTION_STATES.received_web_form ],
    [ ACTION_STATES.waiting_for_response,       ACTION_STATES.request_time_out ],
    [ ACTION_STATES.waiting_for_response,       ACTION_STATES.requester_files_suit ],

    [ ACTION_STATES.requester_files_suit,       ACTION_STATES.decision_pending ],

    [ ACTION_STATES.decision_pending,       ACTION_STATES.decision_lost ],
    [ ACTION_STATES.decision_pending,       ACTION_STATES.decision_won ],
    
    [ ACTION_STATES.decision_won,           ACTION_STATES.repost_media ],
    [ ACTION_STATES.request_time_out,       ACTION_STATES.repost_media ],
    [ ACTION_STATES.not_a_dmca,             ACTION_STATES.repost_media ],
];
