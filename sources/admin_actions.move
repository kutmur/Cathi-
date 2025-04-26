module donation_dao::admin_actions {

    use donation_dao::donation_and_vote;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    /// Creates two initial proposals for the DAO
    /// This function is intended for admin use only during initialization
    public entry fun create_initial_proposals(ctx: &mut TxContext) {
        // Create first proposal - "Support LÖSEV"
        let proposal1 = donation_and_vote::create_proposal(b"Support LOSEV", ctx);
        
        // Create second proposal - "Support TEMA Vakfı"
        let proposal2 = donation_and_vote::create_proposal(b"Support TEMA Vakfi", ctx);
        
        // Share the proposals as shared objects
        transfer::share_object(proposal1);
        transfer::share_object(proposal2);
    }
}