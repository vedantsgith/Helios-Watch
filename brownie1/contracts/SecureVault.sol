// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SecureVault
 * @notice Simple ETH vault with per-user balances and a basic non-reentrancy guard.
 */
contract SecureVault {
    // Reentrancy guard
    uint256 private _locked;

    // Per-account balances
    mapping(address => uint256) public balances;

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);

    modifier nonReentrant() {
        require(_locked == 0, "Reentrant call");
        _locked = 1;
        _;
        _locked = 0;
    }

    /// @notice Deposit ETH into your vault balance.
    function deposit() external payable {
        require(msg.value > 0, "Zero deposit");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw a specified amount of ETH from your balance.
    /// @param amount Amount in wei to withdraw.
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero withdraw");
        uint256 bal = balances[msg.sender];
        require(bal >= amount, "Insufficient balance");
        balances[msg.sender] = bal - amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Total ETH held by the contract.
    function totalHoldings() external view returns (uint256) {
        return address(this).balance;
    }
}
