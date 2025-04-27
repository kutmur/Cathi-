module donation_dao::donation_and_vote {

    use sui::object::{Self, UID};
    use sui::coin::{Self, Coin};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::sui::SUI;

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
    }

    #[init]
    fun init(_ctx: &mut TxContext) {
        // Module initialization logic (if needed)
    }

    public fun create_voter(ctx: &mut TxContext): Voter {
        Voter {
            id: object::new(ctx),
            has_voted: false,
        }
    }

    public fun donate(coin: Coin<SUI>, minimum_amount: u64, ctx: &mut TxContext) {
        let amount = coin::value(&coin);
        assert!(amount >= minimum_amount, 0); // minimum bağış kontrolü
        let treasury = tx_context::sender(ctx);
        transfer::public_transfer(coin, treasury);
    }

    public fun create_proposal(title: vector<u8>, ctx: &mut TxContext): Proposal {
        Proposal {
            id: object::new(ctx),
            title,
            vote_count: 0,
        }
    }

    public fun vote(proposal: &mut Proposal, voter: &mut Voter) {
        assert!(!voter.has_voted, 1); // daha önce oy kullanmadı mı?
        proposal.vote_count = proposal.vote_count + 1;
        voter.has_voted = true;
    }
}
