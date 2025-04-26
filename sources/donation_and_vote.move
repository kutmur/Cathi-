module donation_dao::donation_and_vote {

    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::sui::SUI;
    use sui::event;
    use sui::package;

    // Error constants for better debugging and gas optimization
    const EAlreadyVoted: u64 = 1;
    const EInsufficientDonation: u64 = 2;
    const EProposalNotActive: u64 = 3;

    // One-time witness for the module
    struct DONATION_AND_VOTE has drop {}

    /// Treasury to hold donations
    struct Treasury has key {
        id: UID,
        funds: Balance<SUI>,
    }

    /// Her kullanıcıya ait oy hakkı bilgisi
    struct Voter has key, store {
        id: UID,
        has_voted: bool,
    }

    /// Oylama başlığı ve oy sayısı
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

    // Module initializer
    fun init(witness: DONATION_AND_VOTE, ctx: &mut TxContext) {
        // Create and share treasury
        let treasury = Treasury {
            id: object::new(ctx),
            funds: balance::zero(),
        };
        
        // Share the treasury object
        transfer::share_object(treasury);
        
        // Publish package-specific capability
        package::claim_and_keep(witness, ctx);
    }

    /// Create a voter object for a user
    public fun create_voter(ctx: &mut TxContext): Voter {
        Voter {
            id: object::new(ctx),
            has_voted: false,
        }
    }

    /// Donate SUI to the treasury
    public fun donate(
        treasury: &mut Treasury, 
        coin: Coin<SUI>, 
        minimum_amount: u64,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&coin);
        assert!(amount >= minimum_amount, EInsufficientDonation);
        
        // Extract balance and deposit to treasury
        let balance = coin::into_balance(coin);
        balance::join(&mut treasury.funds, balance);
        
        // Emit donation event
        event::emit(DonationEvent {
            donor: tx_context::sender(ctx),
            amount,
        });
    }

    /// Create a new proposal
    public fun create_proposal(
        title: vector<u8>, 
        ctx: &mut TxContext
    ): Proposal {
        let proposal_id = object::new(ctx);
        let proposal_address = object::uid_to_address(&proposal_id);
        
        // Emit proposal creation event
        event::emit(ProposalCreatedEvent {
            creator: tx_context::sender(ctx),
            proposal_id: proposal_address,
            title: title,
        });
        
        Proposal {
            id: proposal_id,
            title,
            vote_count: 0,
            active: true,
        }
    }

    /// Vote on a proposal
    public fun vote(
        proposal: &mut Proposal, 
        voter: &mut Voter, 
        ctx: &mut TxContext
    ) {
        assert!(!voter.has_voted, EAlreadyVoted);
        assert!(proposal.active, EProposalNotActive);
        
        proposal.vote_count = proposal.vote_count + 1;
        voter.has_voted = true;
        
        // Emit vote event
        event::emit(VoteEvent {
            voter: tx_context::sender(ctx),
            proposal_id: object::uid_to_address(&proposal.id),
        });
    }
    
    /// Close a proposal to prevent further voting
    public fun close_proposal(proposal: &mut Proposal) {
        proposal.active = false;
    }
    
    /// Get treasury balance
    public fun treasury_balance(treasury: &Treasury): u64 {
        balance::value(&treasury.funds)
    }
    
    /// Check if a voter has already voted
    public fun has_voted(voter: &Voter): bool {
        voter.has_voted
    }
    
    /// Get proposal vote count
    public fun vote_count(proposal: &Proposal): u64 {
        proposal.vote_count
    }
    
    /// Get proposal active status
    public fun is_active(proposal: &Proposal): bool {
        proposal.active
    }
}
