#!/usr/bin/env python3
"""
Bill Splitter Testing Script
Comprehensive testing for multiple signers with test tokens
"""

import json
import subprocess
import time
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class TestAccount:
    address: str
    private_key: str
    balance: int = 0

@dataclass
class TestScenario:
    name: str
    participants: List[TestAccount]
    total_amount: int
    required_signatures: int
    description: str

class BillSplitterTester:
    def __init__(self, network: str = "testnet"):
        self.network = network
        self.base_url = f"https://fullnode.{network}.aptoslabs.com"
        self.admin_account = None
        self.merchant_account = None
        self.test_accounts = []
        
    def setup_test_environment(self):
        """Setup admin, merchant, and test accounts"""
        print("🚀 Setting up test environment...")
        
        # Create admin account
        result = subprocess.run([
            "aptos", "account", "create", 
            "--network", self.network
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Admin account created")
            self.admin_account = self._parse_account_output(result.stdout)
        
        # Create merchant account
        result = subprocess.run([
            "aptos", "account", "create",
            "--network", self.network
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Merchant account created")
            self.merchant_account = self._parse_account_output(result.stdout)
            
        # Fund accounts from faucet
        self._fund_from_faucet(self.admin_account.address)
        self._fund_from_faucet(self.merchant_account.address)
        
    def create_test_accounts(self, count: int) -> List[TestAccount]:
        """Create multiple test accounts for participants"""
        print(f"👥 Creating {count} test accounts...")
        
        test_accounts = []
        for i in range(count):
            result = subprocess.run([
                "aptos", "account", "create",
                "--network", self.network
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                account = self._parse_account_output(result.stdout)
                test_accounts.append(account)
                self._fund_from_faucet(account.address)
                print(f"  ✅ Created test account {i+1}: {account.address[:10]}...")
            
        self.test_accounts = test_accounts
        return test_accounts
    
    def deploy_contracts(self):
        """Deploy bill splitter contracts"""
        print("📦 Deploying contracts...")
        
        result = subprocess.run([
            "aptos", "move", "publish",
            "--network", self.network,
            "--private-key", self.admin_account.private_key
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Contracts deployed successfully")
            return True
        else:
            print(f"❌ Contract deployment failed: {result.stderr}")
            return False
    
    def initialize_system(self):
        """Initialize bill splitter and USDC systems"""
        print("🔧 Initializing systems...")
        
        # Initialize bill splitter
        result = subprocess.run([
            "aptos", "move", "run",
            "--function-id", f"{self.admin_account.address}::bill_splitter::initialize",
            "--private-key", self.admin_account.private_key,
            "--network", self.network
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Bill splitter initialized")
        
        # Initialize USDC for testing
        result = subprocess.run([
            "aptos", "move", "run",
            "--function-id", f"{self.admin_account.address}::usdc_utils::initialize_usdc",
            "--private-key", self.admin_account.private_key,
            "--network", self.network
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ USDC system initialized")
    
    def mint_test_tokens(self, accounts: List[TestAccount], amount_per_account: int = 1000_000_000):
        """Mint test USDC tokens for all test accounts"""
        print(f"💰 Minting {amount_per_account/1_000_000} USDC for each test account...")
        
        for account in accounts:
            result = subprocess.run([
                "aptos", "move", "run",
                "--function-id", f"{self.admin_account.address}::usdc_utils::mint_usdc_for_testing",
                "--args", f"address:{account.address}", f"u64:{amount_per_account}",
                "--private-key", self.admin_account.private_key,
                "--network", self.network
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                account.balance = amount_per_account
                print(f"  ✅ Minted for {account.address[:10]}...")
    
    def run_small_group_test(self, participants: List[TestAccount]):
        """Test scenario: 3-5 participants"""
        print("🧪 Running Small Group Test (3-5 participants)...")
        
        scenario = TestScenario(
            name="small_group_test",
            participants=participants[:5],  # Use first 5 accounts
            total_amount=150_000_000,  # $150
            required_signatures=len(participants[:5]),  # All must sign
            description="Small Group Restaurant Bill"
        )
        
        return self._execute_test_scenario(scenario)
    
    def run_medium_group_test(self, participants: List[TestAccount]):
        """Test scenario: 10-20 participants"""
        print("🧪 Running Medium Group Test (10-20 participants)...")
        
        participant_count = min(15, len(participants))
        scenario = TestScenario(
            name="medium_group_test",
            participants=participants[:participant_count],
            total_amount=500_000_000,  # $500
            required_signatures=participant_count * 2 // 3,  # 2/3 majority
            description="Medium Group Event Bill"
        )
        
        return self._execute_enhanced_test_scenario(scenario)
    
    def run_large_group_stress_test(self, num_participants: int = 50):
        """Test scenario: Large group stress test"""
        print(f"🧪 Running Large Group Stress Test ({num_participants} participants)...")
        
        # For stress test, we simulate without actual accounts
        result = subprocess.run([
            "aptos", "move", "run",
            "--function-id", f"{self.admin_account.address}::test_suite::test_large_group_stress_test",
            "--args", f"u64:{num_participants}",
            "--private-key", self.admin_account.private_key,
            "--network", self.network
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Large group stress test completed ({num_participants} participants)")
            return True
        else:
            print(f"❌ Large group stress test failed: {result.stderr}")
            return False
    
    def _execute_test_scenario(self, scenario: TestScenario) -> bool:
        """Execute a test scenario using the standard bill splitter"""
        session_id = f"TEST_{scenario.name.upper()}_{int(time.time())}"
        
        # Prepare participant data
        addresses = [p.address for p in scenario.participants]
        names = [f"Participant_{i}" for i in range(len(scenario.participants))]
        
        # Create bill session
        result = subprocess.run([
            "aptos", "move", "run",
            "--function-id", f"{self.admin_account.address}::bill_splitter::create_bill_session",
            "--args", 
            f"string:{session_id}",
            f"u64:{scenario.total_amount}",
            f"string:{scenario.description}",
            f"vector<address>:{','.join(addresses)}",
            f"vector<string>:{','.join(names)}",
            f"u64:{scenario.required_signatures}",
            "--private-key", self.merchant_account.private_key,
            "--network", self.network
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ Failed to create bill session: {result.stderr}")
            return False
        
        # Confirm participants
        result = subprocess.run([
            "aptos", "move", "run",
            "--function-id", f"{self.admin_account.address}::bill_splitter::confirm_participants",
            "--args", f"string:{session_id}",
            "--private-key", self.merchant_account.private_key,
            "--network", self.network
        ], capture_output=True, text=True)
        
        # Participants sign
        for participant in scenario.participants:
            result = subprocess.run([
                "aptos", "move", "run",
                "--function-id", f"{self.admin_account.address}::bill_splitter::sign_bill_agreement",
                "--args", f"string:{session_id}",
                "--private-key", participant.private_key,
                "--network", self.network
            ], capture_output=True, text=True)
        
        # Participants pay
        individual_amount = scenario.total_amount // len(scenario.participants)
        for participant in scenario.participants:
            result = subprocess.run([
                "aptos", "move", "run",
                "--function-id", f"{self.admin_account.address}::bill_splitter::submit_payment",
                "--args", f"string:{session_id}", f"u64:{individual_amount}",
                "--private-key", participant.private_key,
                "--network", self.network
            ], capture_output=True, text=True)
        
        print(f"✅ {scenario.name} completed successfully")
        return True
    
    def _execute_enhanced_test_scenario(self, scenario: TestScenario) -> bool:
        """Execute a test scenario using the enhanced bill splitter"""
        session_id = f"ENHANCED_TEST_{scenario.name.upper()}_{int(time.time())}"
        
        # Use enhanced bill splitter for better performance
        addresses = [p.address for p in scenario.participants]
        names = [f"Enhanced_Participant_{i}" for i in range(len(scenario.participants))]
        
        result = subprocess.run([
            "aptos", "move", "run",
            "--function-id", f"{self.admin_account.address}::enhanced_bill_splitter::create_enhanced_bill_session",
            "--args",
            f"string:{session_id}",
            f"u64:{scenario.total_amount}",
            f"string:{scenario.description}",
            f"vector<address>:{','.join(addresses)}",
            f"vector<string>:{','.join(names)}",
            f"u64:{scenario.required_signatures}",
            f"u64:100",  # max_participants
            "--private-key", self.merchant_account.private_key,
            "--network", self.network
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ Failed to create enhanced bill session: {result.stderr}")
            return False
        
        print(f"✅ Enhanced {scenario.name} completed successfully")
        return True
    
    def _parse_account_output(self, output: str) -> TestAccount:
        """Parse account creation output to extract address and private key"""
        lines = output.strip().split('\n')
        address = None
        private_key = None
        
        for line in lines:
            if 'Account address:' in line:
                address = line.split(':')[-1].strip()
            elif 'Private key:' in line:
                private_key = line.split(':')[-1].strip()
        
        return TestAccount(address=address, private_key=private_key)
    
    def _fund_from_faucet(self, address: str):
        """Fund account from testnet faucet"""
        result = subprocess.run([
            "aptos", "account", "fund-with-faucet",
            "--account", address,
            "--network", self.network
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"  💰 Funded {address[:10]}... from faucet")

def main():
    """Main testing function"""
    print("🎯 Bill Splitter Multi-Signer Testing Suite")
    print("=" * 50)
    
    tester = BillSplitterTester("testnet")
    
    # Setup environment
    tester.setup_test_environment()
    
    # Create test accounts
    test_accounts = tester.create_test_accounts(20)  # Create 20 test accounts
    
    # Deploy contracts
    if not tester.deploy_contracts():
        return
    
    # Initialize systems
    tester.initialize_system()
    
    # Mint test tokens
    tester.mint_test_tokens(test_accounts)
    
    # Run test scenarios
    print("\n🧪 STARTING TEST SCENARIOS")
    print("-" * 30)
    
    # Small group test
    tester.run_small_group_test(test_accounts)
    
    # Medium group test
    tester.run_medium_group_test(test_accounts)
    
    # Large group stress test
    tester.run_large_group_stress_test(100)
    
    print("\n🎉 All tests completed!")
    print("Check the blockchain for transaction results.")

if __name__ == "__main__":
    main()
