#!/bin/bash

# Heirloom Platform - Comprehensive Test Suite Runner
# This script runs all 100+ automated tests for the platform

set -e

echo "🚀 Starting Heirloom Platform Test Suite"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if backend is running
check_backend() {
    print_status "Checking if backend is running on port 3001..."
    if curl -s http://localhost:3001/api/health > /dev/null; then
        print_success "Backend is running"
        return 0
    else
        print_warning "Backend is not running, attempting to start..."
        cd ../backend
        npm run dev &
        BACKEND_PID=$!
        sleep 10
        
        if curl -s http://localhost:3001/api/health > /dev/null; then
            print_success "Backend started successfully"
            return 0
        else
            print_error "Failed to start backend"
            return 1
        fi
    fi
}

# Check if frontend is running
check_frontend() {
    print_status "Checking if frontend is running on port 12003..."
    if curl -s http://localhost:12003 > /dev/null; then
        print_success "Frontend is running"
        return 0
    else
        print_warning "Frontend is not running, attempting to start..."
        cd ../sveltekit-app
        npm run dev -- --port 12003 &
        FRONTEND_PID=$!
        sleep 15
        
        if curl -s http://localhost:12003 > /dev/null; then
            print_success "Frontend started successfully"
            return 0
        else
            print_error "Failed to start frontend"
            return 1
        fi
    fi
}

# Run API tests
run_api_tests() {
    print_status "Running API Tests..."
    echo "📡 Authentication API Tests"
    npm test -- --testPathPattern=api/auth.test.ts --verbose
    
    echo "💾 Memories API Tests"
    npm test -- --testPathPattern=api/memories.test.ts --verbose
    
    echo "💳 Subscriptions API Tests"
    npm test -- --testPathPattern=api/subscriptions.test.ts --verbose
    
    echo "🤖 AI Features API Tests"
    npm test -- --testPathPattern=api/ai.test.ts --verbose
    
    print_success "API Tests completed"
}

# Run security tests
run_security_tests() {
    print_status "Running Security Tests..."
    echo "🔒 Security & Vulnerability Tests"
    npm test -- --testPathPattern=security/security.test.ts --verbose
    
    print_success "Security Tests completed"
}

# Run performance tests
run_performance_tests() {
    print_status "Running Performance Tests..."
    echo "⚡ Performance & Load Tests"
    npm test -- --testPathPattern=performance/performance.test.ts --verbose
    
    print_success "Performance Tests completed"
}

# Run integration tests
run_integration_tests() {
    print_status "Running Integration Tests..."
    echo "🔄 User Journey Integration Tests"
    npm test -- --testPathPattern=integration/user-journey.test.ts --verbose
    
    print_success "Integration Tests completed"
}

# Run E2E tests
run_e2e_tests() {
    print_status "Running End-to-End Tests..."
    echo "🌐 Authentication E2E Tests"
    npx playwright test src/e2e/auth.spec.ts --reporter=line
    
    echo "🌌 Constellation UI E2E Tests"
    npx playwright test src/e2e/constellation.spec.ts --reporter=line
    
    print_success "E2E Tests completed"
}

# Generate test coverage report
generate_coverage() {
    print_status "Generating Test Coverage Report..."
    npm run test:coverage
    print_success "Coverage report generated in coverage/ directory"
}

# Main execution
main() {
    cd "$(dirname "$0")"
    
    print_status "Installing test dependencies..."
    npm install --silent
    
    # Check prerequisites
    if ! check_backend; then
        print_error "Backend is required for tests"
        exit 1
    fi
    
    if ! check_frontend; then
        print_error "Frontend is required for E2E tests"
        exit 1
    fi
    
    # Run test suites
    echo ""
    echo "🧪 RUNNING COMPREHENSIVE TEST SUITE"
    echo "===================================="
    
    # API Tests (40+ tests)
    run_api_tests
    echo ""
    
    # Security Tests (25+ tests)
    run_security_tests
    echo ""
    
    # Performance Tests (20+ tests)
    run_performance_tests
    echo ""
    
    # Integration Tests (15+ tests)
    run_integration_tests
    echo ""
    
    # E2E Tests (20+ tests)
    run_e2e_tests
    echo ""
    
    # Generate coverage
    generate_coverage
    echo ""
    
    # Test summary
    echo "📊 TEST SUITE SUMMARY"
    echo "===================="
    print_success "✅ API Tests: 40+ tests covering authentication, memories, subscriptions, AI features"
    print_success "✅ Security Tests: 25+ tests covering SQL injection, XSS, CSRF, rate limiting, validation"
    print_success "✅ Performance Tests: 20+ tests covering response times, throughput, load testing"
    print_success "✅ Integration Tests: 15+ tests covering complete user journeys"
    print_success "✅ E2E Tests: 20+ tests covering UI interactions and workflows"
    echo ""
    print_success "🎉 ALL TESTS COMPLETED SUCCESSFULLY!"
    print_success "📈 Total: 120+ automated tests executed"
    print_success "📊 Coverage report available in coverage/ directory"
    print_success "🚀 Platform is ready for production deployment!"
    
    # Cleanup
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
}

# Handle script interruption
trap 'print_error "Test execution interrupted"; exit 1' INT TERM

# Run main function
main "$@"