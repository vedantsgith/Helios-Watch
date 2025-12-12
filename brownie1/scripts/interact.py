from brownie import SecureVault, accounts, Wei


def main():
    """Interact with the most recently deployed SecureVault.

    - Deposits 0.1 ether from the second local account
    - Withdraws 0.05 ether back to the same account
    """
    user = accounts[1]
    vault = SecureVault[-1]

    print(f"Interacting with SecureVault at: {vault.address}")

    tx1 = vault.deposit({"from": user, "value": Wei("0.1 ether")})
    tx1.wait(1)
    print("Deposited 0.1 ETH")

    tx2 = vault.withdraw(Wei("0.05 ether"), {"from": user})
    tx2.wait(1)
    print("Withdrew 0.05 ETH")
