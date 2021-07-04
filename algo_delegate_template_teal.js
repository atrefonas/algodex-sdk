
const algoDelegateTemplate = {

    getTealTemplate : function getTealTemplate() {

    // Stateless delegate contract template to sell algos in an escrow account
// Stateless delegate contract template to sell algos in an escrow account
let delegateTemplate = `#pragma version 3
////////////////////////
// ALGO (NON-ASA) ESCROW 
///////////////////////////
/// ORDER BOOK OPT IN & REGISTRATION
//////////////////////////
    // check for optin transaction or orderbook registration transaction
    // FIRST TXN  - Pay from order creator to escrow account
    // SECOND TXN - Stateful app opt-in to order book
    // THIRD TXN  - Possible ASA opt-in for the order creator's original wallet account. Doesn't need checks
    global GroupSize
    int 2
    ==
    global GroupSize
    int 3
    ==
    ||
    txn TypeEnum
    int appl
    ==
    &&
    txn Amount
    int 0
    ==
    &&
    txn CloseRemainderTo
    global ZeroAddress
    ==
    &&
    txn OnCompletion
    int OptIn //Check OnCompletion is OptIn or NoOp
    ==
    &&
    txn AssetCloseTo
    global ZeroAddress
    ==
    &&
    txn RekeyTo
    global ZeroAddress
    ==
    &&
    txn ApplicationID
    int <orderBookId> // stateful contract app id. orderBookId
    ==
    &&
    gtxn 0 TypeEnum
    int pay
    ==
    &&
    gtxn 0 Receiver // recipient of pay
    txn Sender // escrow account
    ==
    &&
    store 0

    global GroupSize // Third transaction is an optional asset opt-in
    int 3
    <
    store 1

    load 1
    bnz notThreeTxns

    gtxn 2 TypeEnum// Third transaction. 
    int axfer
    ==
    gtxn 2 AssetAmount
    int 0
    ==
    &&
    gtxn 2 Sender
    addr <contractWriterAddr> // contractWriterAddr (order creator)
    ==
    &&
    gtxn 2 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 2 OnCompletion
    int NoOp
    ==
    &&
    gtxn 2 RekeyTo
    global ZeroAddress
    ==
    &&
    store 1

    notThreeTxns:
    load 0
    load 1
    &&
    bz notOptInOrOrderReg // Jump if either is 0
    // If either of the above are not true, this is a closeout (without order execution) or pay transaction
    // Otherwise it is Opt-in so return early
    int 1
    
    return

////////////////////////////////////////
//// CLOSEOUT (ORDER CANCELLED) ////////
////////////////////////////////////////

//TODO: add more checks for 3rd transaction 
    // FIRST  TXN - application call to order book contract for closeout
    // SECOND TXN - close out call
    // THIRD  TXN - send transaction for proof that closeout sender owns the escrow
    notOptInOrOrderReg:
    // Check for close out transaction (without execution)
    global GroupSize
    int 3
    ==
    gtxn 0 CloseRemainderTo
    global ZeroAddress // This is an app call so should be set to 0 address
    ==
    &&
    gtxn 1 CloseRemainderTo
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 2 CloseRemainderTo
    global ZeroAddress
    ==
    &&
    gtxn 0 Sender // first transaction must come from the escrow
    txn Sender
    ==
    &&
    gtxn 1 Sender // second transaction must come from the escrow
    txn Sender
    ==
    &&
    gtxn 2 Sender // proof the close is coming from sender
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 0 TypeEnum
    int appl
    ==
    &&
    gtxn 1 TypeEnum
    int pay
    ==
    &&
    gtxn 2 TypeEnum
    int pay
    ==
    &&
    gtxn 0 Amount
    int 0 //Check all the funds are being sent to the CloseRemainderTo address
    ==
    &&
    gtxn 1 Amount
    int 0 //Check all the funds are being sent to the CloseRemainderTo address
    ==
    &&
    gtxn 2 Amount
    int 0 // This is just a proof so amount should be 0
    ==
    &&
    gtxn 0 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 1 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 2 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 0 OnCompletion
    int CloseOut //Check App Call OnCompletion is CloseOut (OptOut)
    ==
    &&
    gtxn 1 OnCompletion
    int NoOp //pay transaction
    ==
    && 
    gtxn 2 OnCompletion
    int NoOp //proof pay transaction
    ==
    &&
    gtxn 0 AssetCloseTo
    global ZeroAddress // should not matter, but add just in case
    ==
    &&
    gtxn 1 AssetCloseTo
    global ZeroAddress  // should not matter, but add just in case
    ==
    &&
    gtxn 2 AssetCloseTo
    global ZeroAddress  // should not matter, but add just in case
    ==
    &&
    bz checkPayWithCloseout // If the above are not true, this is a pay transaction. Otherwise it is CloseOut so ret success
    
    int 1
    return

///////////////////////////////
// PAY (ORDER EXECUTION)
//   WITH CLOSEOUT
/////////////////////////////////
    // Must be three transactions
    // FIRST TXN - transaction must be a call to a stateful contract
    // SECOND TXN - transaction must be a payment transaction
    // THIRD TXN - transaction must be an asset transfer

    checkPayWithCloseout:
    
    gtxn 1 CloseRemainderTo
    global ZeroAddress
    ==
    bnz partialPayTxn // Jump to here if close remainder is a zero address. This is *not* a close-out

    // We should be here only if this is a full execution with closeout

    gtxn 0 OnCompletion // The application call must be
    int CloseOut  // A general application call or a closeout
    ==
    global GroupSize // this delegate is only used on an execute order
    int 3
    ==
    &&
    gtxn 0 TypeEnum // The first transaction must be an Application Call (i.e. call stateful smart contract)
    int appl
    ==
    &&
    gtxn 1 TypeEnum // The second transaction must be a payment tx
    int pay
    ==
    &&
    gtxn 2 TypeEnum // The third transaction must be an asset xfer tx 
    int axfer
    ==
    &&
    txn Fee
    int 1000
    <=
    &&
    gtxn 0 ApplicationID // The specific Order Book App ID must be called
    int <orderBookId> // stateful contract app id. orderBookId
    ==
    &&
    gtxn 0 RekeyTo // verify no transaction contains a rekey
    global ZeroAddress 
    ==
    &&
    gtxn 1 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 2 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 0 CloseRemainderTo
    global ZeroAddress
    ==
    &&
    gtxn 1 CloseRemainderTo
    addr <contractWriterAddr> // contractWriterAddr
    ==
    &&
    gtxn 2 CloseRemainderTo
    global ZeroAddress
    ==
    && 
    gtxn 0 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 1 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 2 AssetCloseTo
    global ZeroAddress
    ==
    &&
    assert

    b handle_rate_check

///////////////////////////////////
// PAY (ORDER EXECUTION)
//   PARTIAL EXECUTION
/////////////////////////////////
    // Must be four transactions
    // FIRST TXN - transaction must be a call to a stateful contract
    // SECOND TXN - transaction must be a payment transaction
    // THIRD TXN - transaction must be an asset transfer
    // FOURTH TXN - fee refund transaction

    partialPayTxn:

    gtxn 0 OnCompletion // The application call must be a NoOp
    int NoOp
    ==
    txn CloseRemainderTo  //all transactions from this escrow must not have closeouts
    global ZeroAddress
    ==
    &&
    global GroupSize // this delegate is only used on an execute order
    int 4
    ==
    &&
    // The first transaction must be 
    // an ApplicationCall (ie call stateful smart contract)
    gtxn 0 TypeEnum
    int appl
    ==
    &&
    // The second transaction must be 
    // a payment tx 
    gtxn 1 TypeEnum
    int pay
    ==
    &&
    // The third transaction must be 
    // an asset xfer tx 
    gtxn 2 TypeEnum
    int axfer
    ==
    &&
    // The fourth transaction must be 
    // a payment tx for transaction fee reimbursement
    gtxn 3 TypeEnum //FIXME check amount
    int pay
    ==
    &&
    txn Fee
    int 1000
    <=
    &&
    // The specific App ID must be called
    // This should be changed after creation
    // This links this contract to the stateful contract
    gtxn 0 ApplicationID
    int <orderBookId> //stateful contract app id orderBookId
    ==
    &&
    // verify no transaction
    // contains a rekey
    gtxn 0 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 1 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 2 RekeyTo
    global ZeroAddress
    ==
    &&
    gtxn 0 CloseRemainderTo
    global ZeroAddress
    ==
    && 
    gtxn 2 CloseRemainderTo
    global ZeroAddress
    ==
    && 
    gtxn 0 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 1 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 2 AssetCloseTo
    global ZeroAddress
    ==
    &&
    gtxn 3 AssetCloseTo
    global ZeroAddress
    ==
    &&
    assert

    handle_rate_check:
    // min algos spent
    gtxn 1 Amount
    int <min>
    >=
    // asset id to trade for
    int <assetid>
    gtxn 2 XferAsset
    ==
    &&
    assert
    // handle the rate
    // future sell order (not in this contract)
    // gtxn[1].Amount * N >= gtxn[2].AssetAmount * D
    // BUY ORDER
    // gtxn[2].AssetAmount * D >= gtxn[1].Amount * N
    // N units of the asset per D microAlgos
    gtxn 2 AssetAmount
    int <D> // put D value here
    mulw // AssetAmount * D => (high 64 bits, low 64 bits)
    store 2 // move aside low 64 bits
    store 1 // move aside high 64 bits
    gtxn 1 Amount
    int <N> // put N value here
    mulw
    store 4 // move aside low 64 bits
    store 3 // move aside high 64 bits
    // compare high bits to high bits
    load 1
    load 3
    >
    bnz done2
    load 1
    load 3
    ==
    load 2
    load 4
    >=
    && // high bits are equal and low bits are ok
    bnz done2
    err

    done2:
    int 1
    return



    `;
    return delegateTemplate;
    }

}

module.exports = algoDelegateTemplate;
