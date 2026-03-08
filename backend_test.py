#!/usr/bin/env python3
"""
Backend API Testing for Lineup Admin Dashboard
Tests all analytics endpoints using the public URL
"""

import requests
import sys
import json
from datetime import datetime

class LineupAPITester:
    def __init__(self, base_url="https://app-metrics-hub-3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
            self.failed_tests.append({"test": name, "details": details})

    def test_auth_login_valid(self):
        """Test admin login with valid credentials"""
        url = f"{self.base_url}/auth/login"
        data = {
            "email": "admin@lineup-sports.in",
            "password": "LineupAdmin2026!"
        }
        
        try:
            response = requests.post(url, json=data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                if "token" in result and "email" in result:
                    self.token = result["token"]
                    self.log_test("Auth Login Valid", True, f"Token received for {result['email']}")
                    return True
                else:
                    self.log_test("Auth Login Valid", False, "Missing token or email in response")
            else:
                self.log_test("Auth Login Valid", False, f"Status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            self.log_test("Auth Login Valid", False, f"Exception: {str(e)}")
        
        return False

    def test_auth_login_invalid(self):
        """Test login with invalid credentials"""
        url = f"{self.base_url}/auth/login"
        data = {
            "email": "wrong@email.com",
            "password": "wrongpassword"
        }
        
        try:
            response = requests.post(url, json=data, timeout=10)
            if response.status_code == 401:
                self.log_test("Auth Login Invalid", True, "Correctly rejected invalid credentials")
                return True
            else:
                self.log_test("Auth Login Invalid", False, f"Expected 401, got {response.status_code}")
        except Exception as e:
            self.log_test("Auth Login Invalid", False, f"Exception: {str(e)}")
        
        return False

    def test_auth_verify(self):
        """Test token verification"""
        if not self.token:
            self.log_test("Auth Verify", False, "No token available")
            return False
            
        url = f"{self.base_url}/auth/verify"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                result = response.json()
                if result.get("valid") == True:
                    self.log_test("Auth Verify", True, f"Token valid for {result.get('email')}")
                    return True
                else:
                    self.log_test("Auth Verify", False, "Token not marked as valid")
            else:
                self.log_test("Auth Verify", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Auth Verify", False, f"Exception: {str(e)}")
        
        return False

    def test_analytics_overview(self):
        """Test analytics overview endpoint"""
        if not self.token:
            self.log_test("Analytics Overview", False, "No token available")
            return False
            
        url = f"{self.base_url}/analytics/overview"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                required_fields = ["total_users", "total_sessions", "total_participants", 
                                 "active_sessions", "total_venues", "avg_participants", 
                                 "verified_users", "total_downloads"]
                
                missing_fields = [f for f in required_fields if f not in data]
                if not missing_fields:
                    details = f"Users: {data.get('total_users')}, Sessions: {data.get('total_sessions')}, Active: {data.get('active_sessions')}"
                    self.log_test("Analytics Overview", True, details)
                    return True
                else:
                    self.log_test("Analytics Overview", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Analytics Overview", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Analytics Overview", False, f"Exception: {str(e)}")
        
        return False

    def test_analytics_users_growth(self):
        """Test user growth analytics"""
        if not self.token:
            self.log_test("User Growth", False, "No token available")
            return False
            
        url = f"{self.base_url}/analytics/users-growth"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("User Growth", True, f"Returned {len(data)} data points")
                    return True
                else:
                    self.log_test("User Growth", False, "Expected list response")
            else:
                self.log_test("User Growth", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("User Growth", False, f"Exception: {str(e)}")
        
        return False

    def test_analytics_sessions_trend(self):
        """Test sessions trend analytics"""
        if not self.token:
            self.log_test("Sessions Trend", False, "No token available")
            return False
            
        url = f"{self.base_url}/analytics/sessions-trend"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Sessions Trend", True, f"Returned {len(data)} data points")
                    return True
                else:
                    self.log_test("Sessions Trend", False, "Expected list response")
            else:
                self.log_test("Sessions Trend", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Sessions Trend", False, f"Exception: {str(e)}")
        
        return False

    def test_analytics_sport_distribution(self):
        """Test sport distribution analytics"""
        if not self.token:
            self.log_test("Sport Distribution", False, "No token available")
            return False
            
        url = f"{self.base_url}/analytics/sport-distribution"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    sports = [item.get("sport") for item in data]
                    self.log_test("Sport Distribution", True, f"Sports: {sports}")
                    return True
                else:
                    self.log_test("Sport Distribution", False, "Expected non-empty list")
            else:
                self.log_test("Sport Distribution", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Sport Distribution", False, f"Exception: {str(e)}")
        
        return False

    def test_analytics_venue_popularity(self):
        """Test venue popularity analytics"""
        if not self.token:
            self.log_test("Venue Popularity", False, "No token available")
            return False
            
        url = f"{self.base_url}/analytics/venue-popularity"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    venue_count = len(data)
                    self.log_test("Venue Popularity", True, f"Found {venue_count} venues")
                    return True
                else:
                    self.log_test("Venue Popularity", False, "Expected list response")
            else:
                self.log_test("Venue Popularity", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Venue Popularity", False, f"Exception: {str(e)}")
        
        return False

    def test_analytics_session_status(self):
        """Test session status analytics"""
        if not self.token:
            self.log_test("Session Status", False, "No token available")
            return False
            
        url = f"{self.base_url}/analytics/session-status"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    statuses = [item.get("status") for item in data]
                    self.log_test("Session Status", True, f"Statuses: {statuses}")
                    return True
                else:
                    self.log_test("Session Status", False, "Expected list response")
            else:
                self.log_test("Session Status", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Session Status", False, f"Exception: {str(e)}")
        
        return False

    def test_analytics_recent_sessions(self):
        """Test recent sessions analytics"""
        if not self.token:
            self.log_test("Recent Sessions", False, "No token available")
            return False
            
        url = f"{self.base_url}/analytics/recent-sessions"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    session_count = len(data)
                    self.log_test("Recent Sessions", True, f"Found {session_count} sessions")
                    return True
                else:
                    self.log_test("Recent Sessions", False, "Expected list response")
            else:
                self.log_test("Recent Sessions", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Recent Sessions", False, f"Exception: {str(e)}")
        
        return False

    def test_analytics_participants_stats(self):
        """Test participants stats analytics"""
        if not self.token:
            self.log_test("Participants Stats", False, "No token available")
            return False
            
        url = f"{self.base_url}/analytics/participants-stats"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "top_users" in data and "fill_rates" in data:
                    user_count = len(data.get("top_users", []))
                    fill_count = len(data.get("fill_rates", []))
                    self.log_test("Participants Stats", True, f"Top users: {user_count}, Fill rates: {fill_count}")
                    return True
                else:
                    self.log_test("Participants Stats", False, "Missing top_users or fill_rates")
            else:
                self.log_test("Participants Stats", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Participants Stats", False, f"Exception: {str(e)}")
        
        return False

    def test_downloads_get(self):
        """Test get downloads settings"""
        if not self.token:
            self.log_test("Downloads Get", False, "No token available")
            return False
            
        url = f"{self.base_url}/settings/downloads"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "total" in data:
                    total = data.get("total", 0)
                    self.log_test("Downloads Get", True, f"Total downloads: {total}")
                    return True
                else:
                    self.log_test("Downloads Get", False, "Missing total field")
            else:
                self.log_test("Downloads Get", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Downloads Get", False, f"Exception: {str(e)}")
        
        return False

    def test_downloads_update(self):
        """Test update downloads"""
        if not self.token:
            self.log_test("Downloads Update", False, "No token available")
            return False
            
        url = f"{self.base_url}/settings/downloads"
        headers = {"Authorization": f"Bearer {self.token}"}
        data = {
            "count": 100,
            "platform": "android",
            "note": "Test update from backend testing"
        }
        
        try:
            response = requests.put(url, json=data, headers=headers, timeout=10)
            if response.status_code == 200:
                result = response.json()
                if "total" in result:
                    self.log_test("Downloads Update", True, f"Updated total: {result.get('total')}")
                    return True
                else:
                    self.log_test("Downloads Update", False, "Missing total in response")
            else:
                self.log_test("Downloads Update", False, f"Status {response.status_code}: {response.text[:200]}")
        except Exception as e:
            self.log_test("Downloads Update", False, f"Exception: {str(e)}")
        
        return False

    def test_date_filtering(self):
        """Test date range filtering on analytics endpoints"""
        if not self.token:
            self.log_test("Date Filtering", False, "No token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        # Test with Last 30 Days filter 
        from datetime import date, timedelta
        end_date = date.today().isoformat()
        start_date = (date.today() - timedelta(days=30)).isoformat()
        
        params = {"start_date": start_date, "end_date": end_date}
        
        try:
            # Test overview with date filter
            url = f"{self.base_url}/analytics/overview"
            response = requests.get(url, headers=headers, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "total_users" in data:
                    self.log_test("Date Filtering", True, f"Filtered overview data received for {start_date} to {end_date}")
                    return True
                else:
                    self.log_test("Date Filtering", False, "Missing required fields in filtered response")
            else:
                self.log_test("Date Filtering", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("Date Filtering", False, f"Exception: {str(e)}")
        
        return False

    def test_csv_export_users(self):
        """Test CSV export for users"""
        if not self.token:
            self.log_test("CSV Export Users", False, "No token available")
            return False
            
        url = f"{self.base_url}/export/users-csv"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code == 200:
                # Check if response is CSV format
                content_type = response.headers.get('Content-Type', '')
                if 'csv' in content_type.lower() or len(response.content) > 0:
                    self.log_test("CSV Export Users", True, f"CSV export successful, size: {len(response.content)} bytes")
                    return True
                else:
                    self.log_test("CSV Export Users", False, f"Invalid content type: {content_type}")
            else:
                self.log_test("CSV Export Users", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("CSV Export Users", False, f"Exception: {str(e)}")
        
        return False

    def test_csv_export_sessions(self):
        """Test CSV export for sessions"""
        if not self.token:
            self.log_test("CSV Export Sessions", False, "No token available")
            return False
            
        url = f"{self.base_url}/export/sessions-csv"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                if 'csv' in content_type.lower() or len(response.content) > 0:
                    self.log_test("CSV Export Sessions", True, f"CSV export successful, size: {len(response.content)} bytes")
                    return True
                else:
                    self.log_test("CSV Export Sessions", False, f"Invalid content type: {content_type}")
            else:
                self.log_test("CSV Export Sessions", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("CSV Export Sessions", False, f"Exception: {str(e)}")
        
        return False

    def test_csv_export_participants(self):
        """Test CSV export for participants"""
        if not self.token:
            self.log_test("CSV Export Participants", False, "No token available")
            return False
            
        url = f"{self.base_url}/export/participants-csv"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                if 'csv' in content_type.lower() or len(response.content) > 0:
                    self.log_test("CSV Export Participants", True, f"CSV export successful, size: {len(response.content)} bytes")
                    return True
                else:
                    self.log_test("CSV Export Participants", False, f"Invalid content type: {content_type}")
            else:
                self.log_test("CSV Export Participants", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("CSV Export Participants", False, f"Exception: {str(e)}")
        
        return False

    def test_csv_export_with_date_filter(self):
        """Test CSV export with date filtering"""
        if not self.token:
            self.log_test("CSV Export Date Filter", False, "No token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        # Test with Last 30 Days filter
        from datetime import date, timedelta
        end_date = date.today().isoformat()
        start_date = (date.today() - timedelta(days=30)).isoformat()
        
        params = {"start_date": start_date, "end_date": end_date}
        
        try:
            url = f"{self.base_url}/export/users-csv"
            response = requests.get(url, headers=headers, params=params, timeout=15)
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                if 'csv' in content_type.lower() or len(response.content) > 0:
                    self.log_test("CSV Export Date Filter", True, f"Filtered CSV export successful, size: {len(response.content)} bytes")
                    return True
                else:
                    self.log_test("CSV Export Date Filter", False, f"Invalid content type: {content_type}")
            else:
                self.log_test("CSV Export Date Filter", False, f"Status {response.status_code}")
        except Exception as e:
            self.log_test("CSV Export Date Filter", False, f"Exception: {str(e)}")
        
        return False

    def run_all_tests(self):
        """Run all test cases"""
        print("="*60)
        print("LINEUP ADMIN DASHBOARD - BACKEND API TESTING")
        print(f"Testing backend at: {self.base_url}")
        print("="*60)
        
        # Auth tests
        print("\n🔐 AUTHENTICATION TESTS:")
        self.test_auth_login_valid()
        self.test_auth_login_invalid()  
        self.test_auth_verify()
        
        # Analytics tests (only if login succeeded)
        if self.token:
            print("\n📊 ANALYTICS TESTS:")
            self.test_analytics_overview()
            self.test_analytics_users_growth()
            self.test_analytics_sessions_trend()
            self.test_analytics_sport_distribution()
            self.test_analytics_venue_popularity()
            self.test_analytics_session_status()
            self.test_analytics_recent_sessions()
            self.test_analytics_participants_stats()
            
            print("\n⚙️ SETTINGS TESTS:")
            self.test_downloads_get()
            self.test_downloads_update()
            
            print("\n📅 DATE FILTERING TESTS:")
            self.test_date_filtering()
            
            print("\n📄 CSV EXPORT TESTS:")
            self.test_csv_export_users()
            self.test_csv_export_sessions()
            self.test_csv_export_participants()
            self.test_csv_export_with_date_filter()
        else:
            print("\n⚠️ Skipping analytics tests - authentication failed")
        
        # Results summary
        print("\n" + "="*60)
        print("TEST RESULTS SUMMARY")
        print("="*60)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Success rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['details']}")
        
        return success_rate >= 80  # Consider 80%+ as success


def main():
    tester = LineupAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())