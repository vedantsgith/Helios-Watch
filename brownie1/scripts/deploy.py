from brownie import SecureVault, accounts


def main():
    """Deploy the SecureVault contract using the first local account."""
    deployer = accounts[0]
    vault = SecureVault.deploy({"from": deployer})
    print(f"SecureVault deployed at: {vault.address}")
    return vault
