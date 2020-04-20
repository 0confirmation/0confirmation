from .conftest import UU


def test_migration(w3, coins, cerc20s, swap_v1, swap_v2,
                   pool_token_1, pool_token_2, migration):
    sam = w3.eth.accounts[0]  # Sam owns the bank
    bob = w3.eth.accounts[1]
    from_sam = {'from': sam}
    from_bob = {'from': bob}

    # Allow $1000 of each coin
    deposits = []
    for c, cc, u in zip(coins, cerc20s, UU):
        c.functions.approve(cc.address, 2000 * u).transact(from_sam)
        cc.functions.mint(2000 * u).transact(from_sam)
        balance = cc.caller.balanceOf(sam)
        cc.functions.transfer(bob, balance // 2).transact(from_sam)
        balance = cc.caller.balanceOf(sam)
        deposits.append(balance)
        cc.functions.approve(swap_v1.address, balance).transact(from_sam)
        balance = cc.caller.balanceOf(bob)
        cc.functions.approve(swap_v1.address, balance).transact(from_bob)

    assert pool_token_1.caller.balanceOf(sam) == 0
    swap_v1.functions.add_liquidity(deposits, 2 ** 255).transact(from_sam)
    b = pool_token_1.caller.balanceOf(sam)
    assert b > 0

    assert pool_token_1.caller.balanceOf(bob) == 0
    swap_v1.functions.add_liquidity(deposits, 2 ** 255).transact(from_bob)
    b = pool_token_1.caller.balanceOf(bob)
    assert b > 0

    pool_token_1.functions.approve(migration.address, b).transact(from_sam)
    migration.functions.migrate().transact(from_sam)

    pool_token_1.functions.approve(migration.address, b).transact(from_bob)
    migration.functions.migrate().transact(from_bob)

    assert pool_token_1.caller.balanceOf(sam) == 0
    assert pool_token_2.caller.balanceOf(sam) > 0
    assert pool_token_1.caller.balanceOf(bob) == 0
    assert pool_token_2.caller.balanceOf(bob) > 0
