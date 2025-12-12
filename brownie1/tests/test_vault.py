import pytest
from brownie import SecureVault, accounts, Wei, reverts


@pytest.fixture(scope="module")
def vault():
    return SecureVault.deploy({"from": accounts[0]})


def test_deposit_increases_balance(vault):
    user = accounts[1]
    amount = Wei("1 ether")
    tx = vault.deposit({"from": user, "value": amount})
    tx.wait(1)
    assert vault.balances(user) == amount


def test_withdraw_decreases_balance_and_transfers(vault):
    user = accounts[2]
    deposit = Wei("1 ether")
    withdraw_amount = Wei("0.4 ether")

    vault.deposit({"from": user, "value": deposit}).wait(1)
    balance_before = user.balance()
    tx = vault.withdraw(withdraw_amount, {"from": user})
    tx.wait(1)

    assert vault.balances(user) == deposit - withdraw_amount
    # Some gas is used; ensure the user’s balance increased by approximately withdraw_amount
    assert user.balance() > balance_before


def test_zero_deposit_reverts(vault):
    user = accounts[3]
    with reverts("Zero deposit"):
        vault.deposit({"from": user, "value": 0})


def test_over_withdraw_reverts(vault):
    user = accounts[4]
    vault.deposit({"from": user, "value": Wei("0.2 ether")}).wait(1)
    with reverts("Insufficient balance"):
        vault.withdraw(Wei("0.3 ether"), {"from": user})


def test_zero_withdraw_reverts(vault):
    user = accounts[5]
    vault.deposit({"from": user, "value": Wei("0.1 ether")}).wait(1)
    with reverts("Zero withdraw"):
        vault.withdraw(0, {"from": user})
