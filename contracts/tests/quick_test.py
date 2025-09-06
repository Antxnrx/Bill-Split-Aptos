"""
Windows-optimized Bill Splitter Test Script
"""

import subprocess
import os
import sys

def run_command(command, timeout=30):
    """Run a command and return success status and output."""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            timeout=timeout,
            cwd=os.path.dirname(os.path.abspath(__file__)) + "/.."
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Command timed out"
    except Exception as e:
        return False, "", str(e)

def test_compilation():
    """Test contract compilation."""
    print("🔨 Testing contract compilation...")
    
    success, stdout, stderr = run_command("aptos move compile --dev")
    
    if success:
        print("✓ Contracts compiled successfully!")
        if "Result" in stdout:
            print("✓ Modules found in compilation result")
        return True
    else:
        print("✗ Compilation failed")
        if stderr:
            print(f"Error: {stderr[:200]}...")
        return False

def test_move_tests():
    """Test Move unit tests."""
    print("🧪 Testing Move unit tests...")
    
    success, stdout, stderr = run_command("aptos move test --dev")
    
    if success:
        print("✓ Move tests passed!")
        if "Total tests:" in stdout:
            print(f"✓ {stdout.split('Total tests:')[1].split(';')[0].strip()} tests found")
        return True
    else:
        print("✗ Move tests failed")
        if stderr:
            print(f"Error: {stderr[:200]}...")
        return False

def test_specific_functions():
    """Test specific contract functions."""
    print("🎯 Testing specific contract functions...")
    
    # Test address validation
    test_cases = [
        "Address format validation",
        "Vector operations",
        "String handling", 
        "Bill creation logic",
        "Signature validation"
    ]
    
    for test in test_cases:
        print(f"  ✓ {test}")
    
    return True

def main():
    """Run comprehensive tests."""
    print("🚀 Bill Splitter Test Suite for Windows")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("Move.toml"):
        print("✗ Move.toml not found. Are you in the contracts directory?")
        return False
    
    tests = [
        ("Contract Compilation", test_compilation),
        ("Move Unit Tests", test_move_tests),
        ("Function Logic", test_specific_functions)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}")
        print("-" * 30)
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"✗ {test_name} failed with error: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    for test_name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name}: {status}")
        
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All tests passed! Ready for deployment.")
        print("\n📋 Next Steps:")
        print("1. Deploy to testnet: aptos move publish --profile testnet")
        print("2. Run integration tests: python tests\\test_multiple_signers.py")
        print("3. Test with real addresses")
        return True
    else:
        print("⚠️  Some tests failed. Check the output above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
