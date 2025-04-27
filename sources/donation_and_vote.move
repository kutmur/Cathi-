module donation_dao::donation_and_vote {

    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::sui::SUI;
    use sui::event;
    use sui::package;
    use sui::test_scenario::{Self, Scenario};

    // Module constants
    const MINIMUM_DONATION_AMOUNT: u64 = 1_000_000; // 0.001 SUI

    // Error constants
    const EAlreadyVoted: u64 = 1;
    const EInsufficientDonation: u64 = 2;
    const EProposalNotActive: u64 = 3;

    // One-time witness for the module
    struct DONATION_AND_VOTE has drop {}

    /// Treasury to hold all donations
    struct Treasury has key {
        id: UID,
        funds: Balance<SUI>,
    }

    /// Voter record tracking voting status
    struct Voter has key, store {
        id: UID,
        has_voted: bool,
    }

    /// Proposal with title, vote count and active status
    struct Proposal has key, store {
        id: UID,
        title: vector<u8>,
        vote_count: u64,
        active: bool,
    }

    // Events
    struct DonationEvent has copy, drop {
        donor: address,
        amount: u64,
    }

    struct VoteEvent has copy, drop {
        voter: address,
        proposal_id: address,
    }

    struct ProposalCreatedEvent has copy, drop {
        creator: address,
        proposal_id: address,
        title: vector<u8>,
    }

    /// Module initializer creates and shares the Treasury
    fun init(witness: DONATION_AND_VOTE, ctx: &mut TxContext) {
        let treasury = Treasury {
            id: object::new(ctx),
            funds: balance::zero(),
        };
        
        transfer::share_object(treasury);
        package::claim_and_keep(witness, ctx);
    }

    /// Creates a voter object for a user
    public fun create_voter(ctx: &mut TxContext): Voter {
        Voter {
            id: object::new(ctx),
            has_voted: false,
        }
    }

    /// Donates SUI to the treasury
    public fun donate(
        treasury: &mut Treasury, 
        coin: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&coin);
        assert!(amount >= MINIMUM_DONATION_AMOUNT, EInsufficientDonation);
        
        let balance = coin::into_balance(coin);
        balance::join(&mut treasury.funds, balance);
        
        event::emit(DonationEvent {
            donor: tx_context::sender(ctx),
            amount,
        });
    }

    /// Creates a new proposal
    public fun create_proposal(
        title: vector<u8>, 
        ctx: &mut TxContext
    ): Proposal {
        let proposal_id = object::new(ctx);
        let proposal_address = object::uid_to_address(&proposal_id);
        
        event::emit(ProposalCreatedEvent {
            creator: tx_context::sender(ctx),
            proposal_id: proposal_address,
            title: copy title,
        });
        
        Proposal {
            id: proposal_id,
            title,
            vote_count: 0,
            active: true,
        }
    }

    /// Shares a proposal object
    public fun share_proposal(proposal: Proposal) {
        transfer::share_object(proposal);
    }

    /// Votes on a proposal
    public fun vote(
        proposal: &mut Proposal, 
        voter: &mut Voter, 
        ctx: &mut TxContext
    ) {
        assert!(!voter.has_voted, EAlreadyVoted);
        assert!(proposal.active, EProposalNotActive);
        
        proposal.vote_count = proposal.vote_count + 1;
        voter.has_voted = true;
        
        event::emit(VoteEvent {
            voter: tx_context::sender(ctx),
            proposal_id: object::uid_to_address(&proposal.id),
        });
    }
    
    /// Closes a proposal to prevent further voting
    public fun close_proposal(proposal: &mut Proposal) {
        proposal.active = false;
    }
    
    /// Returns the treasury balance
    public fun treasury_balance(treasury: &Treasury): u64 {
        balance::value(&treasury.funds)
    }
    
    /// Checks if a voter has already voted
    public fun has_voted(voter: &Voter): bool {
        voter.has_voted
    }
    
    /// Returns proposal vote count
    public fun vote_count(proposal: &Proposal): u64 {
        proposal.vote_count
    }
    
    /// Checks if a proposal is active
    public fun is_active(proposal: &Proposal): bool {
        proposal.active
    }

    // ===== Tests =====

    #[test]
    fun test_create_voter() {
        let scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Create voter
        let voter = create_voter(ctx);
        
        // Verify voter status
        assert!(!has_voted(&voter), 0);
        
        // Clean up
        let Voter { id, has_voted: _ } = voter;
        object::delete(id);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_successful_donation() {
        let scenario = test_scenario::begin(@0x1);
        {
            // Initialize module
            let ctx = test_scenario::ctx(&mut scenario);
            init(DONATION_AND_VOTE {}, ctx);
        };

        // Get treasury
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let treasury = test_scenario::take_shared<Treasury>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Create coin with sufficient funds
            let coin = coin::mint_for_testing<SUI>(MINIMUM_DONATION_AMOUNT, ctx);
            let initial_balance = treasury_balance(&treasury);
            
            // Make donation
            donate(&mut treasury, coin, ctx);
            
            // Verify balance increased
            let final_balance = treasury_balance(&treasury);
            assert!(final_balance == initial_balance + MINIMUM_DONATION_AMOUNT, 0);
            
            test_scenario::return_shared(treasury);
        };
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = EInsufficientDonation)]
    fun test_fail_donation_below_minimum() {
        let scenario = test_scenario::begin(@0x1);
        {
            // Initialize module
            let ctx = test_scenario::ctx(&mut scenario);
            init(DONATION_AND_VOTE {}, ctx);
        };

        // Get treasury
        test_scenario::next_tx(&mut scenario, @0x1);
        {
            let treasury = test_scenario::take_shared<Treasury>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Create coin with insufficient funds
            let coin = coin::mint_for_testing<SUI>(MINIMUM_DONATION_AMOUNT - 1, ctx);
            
            // This should abort with EInsufficientDonation
            donate(&mut treasury, coin, ctx);
            
            test_scenario::return_shared(treasury);
        };
        test_scenario::end(scenario);
    }

    #[test]
    fun test_create_proposal() {
        let scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Create proposal
        let title = b"Test Proposal";
        let proposal = create_proposal(title, ctx);
        
        // Verify proposal properties
        assert!(vote_count(&proposal) == 0, 0);
        assert!(is_active(&proposal), 0);
        
        // Clean up
        let Proposal { id, title: _, vote_count: _, active: _ } = proposal;
        object::delete(id);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_successful_voting() {
        let scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Create proposal and voter
        let title = b"Test Proposal";
        let proposal = create_proposal(title, ctx);
        let voter = create_voter(ctx);
        
        // Vote
        vote(&mut proposal, &mut voter, ctx);
        
        // Verify vote was counted and voter status updated
        assert!(vote_count(&proposal) == 1, 0);
        assert!(has_voted(&voter), 0);
        
        // Clean up
        let Proposal { id: proposal_id, title: _, vote_count: _, active: _ } = proposal;
        let Voter { id: voter_id, has_voted: _ } = voter;
        object::delete(proposal_id);
        object::delete(voter_id);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = EAlreadyVoted)]
    fun test_fail_voting_twice() {
        let scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Create proposal and voter
        let title = b"Test Proposal";
        let proposal = create_proposal(title, ctx);
        let voter = create_voter(ctx);
        
        // Vote once
        vote(&mut proposal, &mut voter, ctx);
        
        // Vote again - should fail with EAlreadyVoted
        vote(&mut proposal, &mut voter, ctx);
        
        // Clean up (won't reach here due to expected failure)
        let Proposal { id: proposal_id, title: _, vote_count: _, active: _ } = proposal;
        let Voter { id: voter_id, has_voted: _ } = voter;
        object::delete(proposal_id);
        object::delete(voter_id);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = EProposalNotActive)]
    fun test_fail_voting_inactive_proposal() {
        let scenario = test_scenario::begin(@0x1);
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Create proposal and voter
        let title = b"Test Proposal";
        let proposal = create_proposal(title, ctx);
        let voter = create_voter(ctx);
        
        // Close proposal
        close_proposal(&mut proposal);
        
        // Try to vote on closed proposal - should fail
        vote(&mut proposal, &mut voter, ctx);
        
        // Clean up (won't reach here due to expected failure)
        let Proposal { id: proposal_id, title: _, vote_count: _, active: _ } = proposal;
        let Voter { id: voter_id, has_voted: _ } = voter;
        object::delete(proposal_id);
        object::delete(voter_id);
        test_scenario::end(scenario);
    }
}
